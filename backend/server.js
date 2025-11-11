const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 5001;

// ==================== Evaluation Metrics Functions ====================

// Calculate Levenshtein Distance
function calculateLevenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

// Calculate Character Error Rate (CER)
function calculateCER(groundTruth, extracted) {
  if (!groundTruth || !extracted) return null;

  const gt = groundTruth.trim();
  const ex = extracted.trim();

  if (gt.length === 0) return 0;

  const distance = calculateLevenshteinDistance(gt, ex);
  const cer = (distance / gt.length) * 100;

  return parseFloat(cer.toFixed(2));
}

// Calculate Word Error Rate (WER)
function calculateWER(groundTruth, extracted) {
  if (!groundTruth || !extracted) return null;

  const gtWords = groundTruth.trim().split(/\s+/);
  const exWords = extracted.trim().split(/\s+/);

  if (gtWords.length === 0) return 0;

  const distance = calculateLevenshteinDistance(gtWords.join(' '), exWords.join(' '));
  const wer = (distance / gtWords.join(' ').length) * 100;

  return parseFloat(wer.toFixed(2));
}

// Calculate Text Similarity (0-100%)
function calculateTextSimilarity(groundTruth, extracted) {
  if (!groundTruth || !extracted) return null;

  const gt = groundTruth.trim();
  const ex = extracted.trim();

  if (gt.length === 0 && ex.length === 0) return 100;
  if (gt.length === 0 || ex.length === 0) return 0;

  const maxLen = Math.max(gt.length, ex.length);
  const distance = calculateLevenshteinDistance(gt, ex);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return parseFloat(similarity.toFixed(2));
}

// Analyze Structure Recognition
function analyzeStructure(rawResponse) {
  const structure = {
    tables: 0,
    images: 0,
    charts: 0,
    headings: 0,
    paragraphs: 0,
    lists: 0
  };

  if (!rawResponse) return structure;

  // Convert to string for analysis
  const responseStr = JSON.stringify(rawResponse).toLowerCase();

  // Count various structure elements (heuristic approach)
  // Tables
  if (rawResponse.tables) {
    structure.tables = Array.isArray(rawResponse.tables) ? rawResponse.tables.length : 1;
  } else {
    structure.tables = (responseStr.match(/table/g) || []).length;
  }

  // Images
  if (rawResponse.images) {
    structure.images = Array.isArray(rawResponse.images) ? rawResponse.images.length : 1;
  } else if (rawResponse.figures) {
    structure.images = Array.isArray(rawResponse.figures) ? rawResponse.figures.length : 1;
  } else {
    structure.images = (responseStr.match(/image|figure/g) || []).length;
  }

  // Charts
  if (rawResponse.charts) {
    structure.charts = Array.isArray(rawResponse.charts) ? rawResponse.charts.length : 1;
  } else {
    structure.charts = (responseStr.match(/chart/g) || []).length;
  }

  // Headings
  if (rawResponse.headings) {
    structure.headings = Array.isArray(rawResponse.headings) ? rawResponse.headings.length : 1;
  } else {
    structure.headings = (responseStr.match(/heading|title|h1|h2|h3/g) || []).length;
  }

  // Paragraphs
  if (rawResponse.paragraphs) {
    structure.paragraphs = Array.isArray(rawResponse.paragraphs) ? rawResponse.paragraphs.length : 1;
  } else {
    structure.paragraphs = (responseStr.match(/paragraph/g) || []).length;
  }

  // Lists
  if (rawResponse.lists) {
    structure.lists = Array.isArray(rawResponse.lists) ? rawResponse.lists.length : 1;
  } else {
    structure.lists = (responseStr.match(/list|bullet/g) || []).length;
  }

  return structure;
}

// Calculate Evaluation Metrics
function calculateEvaluationMetrics(groundTruth, extractedText, rawResponse) {
  if (!groundTruth) return null;

  return {
    cer: calculateCER(groundTruth, extractedText),
    wer: calculateWER(groundTruth, extractedText),
    textSimilarity: calculateTextSimilarity(groundTruth, extractedText),
    structureAnalysis: analyzeStructure(rawResponse)
  };
}

// ==================== End of Evaluation Metrics Functions ====================

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// In-memory storage for API keys (in production, use secure storage)
let apiKeys = {
  interex: null,
  upstage: null
};

// API Keys endpoint
app.post('/api/keys', (req, res) => {
  const { interexKey, upstageKey } = req.body;

  if (interexKey) apiKeys.interex = interexKey;
  if (upstageKey) apiKeys.upstage = upstageKey;

  res.json({ success: true, message: 'API keys saved successfully' });
});

app.get('/api/keys', (req, res) => {
  res.json({
    interexKeySet: !!apiKeys.interex,
    upstageKeySet: !!apiKeys.upstage
  });
});

// Interex Document AI API call
async function callInterexDocumentAI(filePath, apiKey) {
  const startTime = Date.now();

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('title', 'Document Analysis');
    formData.append('subtitle', 'Uploaded Document');
    formData.append('language', 'en');
    formData.append('output_format', 'html,text,markdown');
    formData.append('output_base64', 'figure,chart');
    formData.append('output_table', 'true');
    formData.append('coordinates', 'true');

    // Measure request start time
    const requestStartTime = Date.now();

    const response = await axios.post(
      'https://console.interxlab.io/api/document_parser/document_ai/sync',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-API-Key': apiKey
        },
        timeout: 120000
      }
    );

    // Measure response received time
    const responseReceivedTime = Date.now();
    const totalTime = responseReceivedTime - requestStartTime;

    // Try to extract server processing time from API response if available
    let serverProcessingTime = null;
    let networkLatency = null;

    // Check if Interex API provides processing time in response
    if (response.data?.processingTime) {
      serverProcessingTime = response.data.processingTime;
      networkLatency = totalTime - serverProcessingTime;
    } else if (response.data?.data?.processingTime) {
      serverProcessingTime = response.data.data.processingTime;
      networkLatency = totalTime - serverProcessingTime;
    } else {
      // If server doesn't provide processing time, we can't separate accurately
      // Estimate: assume minimal network overhead for now
      serverProcessingTime = totalTime;
      networkLatency = 0; // We can't measure accurately without server info
    }

    const processingTime = totalTime; // Keep for backward compatibility

    console.log('=== INTEREX API RESPONSE STRUCTURE ===');
    console.log('response.data keys:', Object.keys(response.data));
    console.log('response.data.status:', response.data.status);
    console.log('response.data.code:', response.data.code);
    console.log('response.data.message:', response.data.message);
    console.log('response.data.data:', response.data.data ? 'EXISTS' : 'MISSING');

    // Print entire response structure for debugging
    console.log('\n--- FULL INTEREX RESPONSE ---');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('--- END FULL RESPONSE ---\n');

    // Check if Interex returned an error (even with HTTP 200)
    if (response.data.code && response.data.code !== 'OK' && response.data.code !== 'SUCCESS') {
      console.error('Interex API returned an error code:', response.data.code);
      return {
        success: false,
        error: response.data.message || 'Unknown error from Interex API',
        errorDetails: response.data,
        processingTime: totalTime,
        totalTime,
        serverProcessingTime,
        networkLatency
      };
    }

    // Check if response.data.data exists (successful response should have this)
    if (!response.data.data) {
      console.error('Interex API response missing data field');
      return {
        success: false,
        error: 'Invalid API response: missing data field',
        errorDetails: response.data,
        processingTime: totalTime,
        totalTime,
        serverProcessingTime,
        networkLatency
      };
    }

    if (response.data.data) {
      console.log('response.data.data keys:', Object.keys(response.data.data));
      console.log('response.data.data.text:', response.data.data.text ? `EXISTS (${response.data.data.text.length} chars)` : 'MISSING');

      // Inspect result field
      if (response.data.data.result) {
        console.log('response.data.data.result type:', typeof response.data.data.result);
        if (typeof response.data.data.result === 'object') {
          console.log('response.data.data.result keys:', Object.keys(response.data.data.result));

          // Check elements structure - DETAILED
          if (response.data.data.result.elements) {
            console.log('elements exists, type:', Array.isArray(response.data.data.result.elements) ? 'array' : 'object');
            if (Array.isArray(response.data.data.result.elements)) {
              console.log('elements count:', response.data.data.result.elements.length);

              // Check for tables, formulas, images in elements
              const tables = response.data.data.result.elements.filter(el => el.category === 'table' || el.type === 'table');
              const formulas = response.data.data.result.elements.filter(el => el.category === 'formula' || el.type === 'formula' || el.category === 'equation');
              const images = response.data.data.result.elements.filter(el => el.category === 'figure' || el.type === 'figure' || el.category === 'image');

              console.log('Tables found:', tables.length);
              console.log('Formulas found:', formulas.length);
              console.log('Images/Figures found:', images.length);

              if (response.data.data.result.elements.length > 0) {
                console.log('\n--- FIRST ELEMENT SAMPLE ---');
                console.log('element[0] keys:', Object.keys(response.data.data.result.elements[0]));
                console.log('element[0]:', JSON.stringify(response.data.data.result.elements[0], null, 2));
                console.log('--- END FIRST ELEMENT ---\n');
              }

              // Show sample of each type if exists (INTEREX)
              if (tables.length > 0) {
                console.log('\n--- FIRST TABLE ELEMENT (INTEREX) ---');
                console.log(JSON.stringify(tables[0], null, 2));
                console.log('--- END TABLE ---\n');
              }

              if (formulas.length > 0) {
                console.log('\n--- FIRST FORMULA ELEMENT (INTEREX) ---');
                console.log(JSON.stringify(formulas[0], null, 2));
                console.log('--- END FORMULA ---\n');
              }

              if (images.length > 0) {
                console.log('\n--- FIRST IMAGE ELEMENT (INTEREX FULL STRUCTURE) ---');
                console.log('All keys:', Object.keys(images[0]));
                console.log(JSON.stringify(images[0], null, 2));

                // Check for base64 data in various possible locations
                if (images[0].base64) console.log('HAS base64 field!');
                if (images[0].image) console.log('HAS image field!');
                if (images[0].data) console.log('HAS data field!');
                if (images[0].content?.base64) console.log('HAS content.base64 field!');
                if (images[0].content?.image) console.log('HAS content.image field!');
                if (images[0].src) console.log('HAS src field!');

                console.log('--- END IMAGE ---\n');
              }
            }
          }

          // Check pages structure
          if (response.data.data.result.pages) {
            console.log('pages exists, type:', Array.isArray(response.data.data.result.pages) ? 'array' : 'object');
            if (!Array.isArray(response.data.data.result.pages)) {
              console.log('pages keys:', Object.keys(response.data.data.result.pages));
              const firstPageKey = Object.keys(response.data.data.result.pages)[0];
              if (firstPageKey) {
                console.log(`pages['${firstPageKey}'] keys:`, Object.keys(response.data.data.result.pages[firstPageKey]));
              }
            }
          }

          // Check if HTML/markdown is in response.data.data directly
          console.log('Checking response.data.data for html/markdown...');
          if (response.data.data.html) {
            console.log('response.data.data.html: EXISTS');
          }
          if (response.data.data.markdown) {
            console.log('response.data.data.markdown: EXISTS');
          }
          if (response.data.data.result.html) {
            console.log('response.data.data.result.html: EXISTS');
          }
          if (response.data.data.result.markdown) {
            console.log('response.data.data.result.markdown: EXISTS');
          }
        }
      }
    }
    console.log('======================================');

    // Extract text, html, and json outputs
    const result = response.data.data?.result || {};

    // Extract text and HTML from elements array
    let extractedText = '';
    let extractedHtml = '';
    if (result.elements && Array.isArray(result.elements)) {
      // Extract text
      extractedText = result.elements
        .map(element => {
          const content = element.content;
          // Handle different content types
          if (typeof content === 'string') {
            return content;
          } else if (content && typeof content === 'object') {
            return content.text || JSON.stringify(content);
          }
          return '';
        })
        .filter(content => content.trim() !== '')
        .join('\n');

      // Extract HTML - check multiple possible locations
      const htmlParts = result.elements
        .map(element => element.html || '')
        .filter(html => html.trim() !== '');
      extractedHtml = htmlParts.join('\n\n');
    }

    // Try to get HTML from other locations if not found in elements
    if (!extractedHtml) {
      // Check if HTML exists in result directly
      if (result.html) {
        extractedHtml = result.html;
      }
      // Check if HTML exists in content object
      else if (result.content && typeof result.content === 'object' && result.content.html) {
        extractedHtml = result.content.html;
      }
      // Check in response.data.data directly
      else if (response.data.data.html) {
        extractedHtml = response.data.data.html;
      }
      // Check in response.data.data.content
      else if (response.data.data.content && typeof response.data.data.content === 'object' && response.data.data.content.html) {
        extractedHtml = response.data.data.content.html;
      }
    }

    // Extract JSON - Interex returns the entire API response as JSON
    let extractedJson = '';
    // For Interex, the JSON output is the entire raw response stringified
    extractedJson = JSON.stringify(result, null, 2);

    // Also try to get from pages if available
    if (result.pages && typeof result.pages === 'object') {
      const pageKeys = Object.keys(result.pages);
      if (pageKeys.length > 0) {
        // Collect Markdown from all pages (if available)
        const markdownParts = pageKeys.map(pageKey => {
          return result.pages[pageKey]?.markdown || result.pages[pageKey]?.text || '';
        }).filter(md => md.trim() !== '');
        if (markdownParts.length > 0 && !extractedJson) {
          extractedJson = markdownParts.join('\n\n');
        }
      }
    }

    return {
      success: true,
      extractedText: extractedText,
      extractedHtml: extractedHtml,
      extractedJson: extractedJson,
      structuredData: response.data.data || response.data.structured || response.data.content || response.data,
      processingTime,
      totalTime,
      serverProcessingTime,
      networkLatency,
      rawResponse: response.data.data?.result || response.data  // Pass the actual result object for pattern analysis
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Interex API Error:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      errorDetails: error.response?.data,
      processingTime
    };
  }
}

// Upstage Document Parser API call
async function callUpstageDocumentParser(filePath, apiKey) {
  const startTime = Date.now();

  try {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(filePath));
    formData.append('output_formats', '["html", "text"]');
    formData.append('base64_encoding', '["table", "figure"]');
    formData.append('ocr', 'auto');
    formData.append('coordinates', 'true');
    formData.append('model', 'document-parse');

    // Measure request start time
    const requestStartTime = Date.now();

    const response = await axios.post(
      'https://api.upstage.ai/v1/document-digitization',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 90000
      }
    );

    // Measure response received time
    const responseReceivedTime = Date.now();
    const totalTime = responseReceivedTime - requestStartTime;

    // Try to extract server processing time from API response if available
    let serverProcessingTime = null;
    let networkLatency = null;

    // Check if Upstage API provides processing time in response
    if (response.data?.processingTime) {
      serverProcessingTime = response.data.processingTime;
      networkLatency = totalTime - serverProcessingTime;
    } else if (response.data?.usage?.processing_time) {
      serverProcessingTime = response.data.usage.processing_time;
      networkLatency = totalTime - serverProcessingTime;
    } else {
      // If server doesn't provide processing time, we can't separate accurately
      serverProcessingTime = totalTime;
      networkLatency = 0; // We can't measure accurately without server info
    }

    const processingTime = totalTime; // Keep for backward compatibility

    console.log('=== UPSTAGE API RESPONSE STRUCTURE ===');
    console.log('response.data keys:', Object.keys(response.data));

    if (response.data.content) {
      console.log('response.data.content keys:', Object.keys(response.data.content));
    }

    // Print entire response structure for debugging
    console.log('\n--- FULL UPSTAGE RESPONSE ---');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('--- END FULL RESPONSE ---\n');

    // Analyze elements array for tables, formulas, images
    if (response.data.elements) {
      console.log('elements exists, type:', Array.isArray(response.data.elements) ? 'array' : 'object');
      if (Array.isArray(response.data.elements)) {
        console.log('elements count:', response.data.elements.length);

        // Check for tables, formulas, images in elements
        const tables = response.data.elements.filter(el => el.category === 'table' || el.type === 'table');
        const formulas = response.data.elements.filter(el => el.category === 'formula' || el.type === 'formula' || el.category === 'equation');
        const images = response.data.elements.filter(el => el.category === 'figure' || el.type === 'figure' || el.category === 'image');

        console.log('Tables found:', tables.length);
        console.log('Formulas found:', formulas.length);
        console.log('Images/Figures found:', images.length);

        if (response.data.elements.length > 0) {
          console.log('\n--- FIRST ELEMENT SAMPLE ---');
          console.log('element[0] keys:', Object.keys(response.data.elements[0]));
          console.log('element[0]:', JSON.stringify(response.data.elements[0], null, 2));
          console.log('--- END FIRST ELEMENT ---\n');
        }

        // Show sample of each type if exists
        if (tables.length > 0) {
          console.log('\n--- FIRST TABLE ELEMENT ---');
          console.log(JSON.stringify(tables[0], null, 2));
          console.log('--- END TABLE ---\n');
        }

        if (formulas.length > 0) {
          console.log('\n--- FIRST FORMULA ELEMENT ---');
          console.log(JSON.stringify(formulas[0], null, 2));
          console.log('--- END FORMULA ---\n');
        }

        if (images.length > 0) {
          console.log('\n--- FIRST IMAGE ELEMENT (FULL STRUCTURE) ---');
          console.log('All keys:', Object.keys(images[0]));
          console.log(JSON.stringify(images[0], null, 2));

          // Check for base64 data in various possible locations
          if (images[0].base64) console.log('HAS base64 field!');
          if (images[0].image) console.log('HAS image field!');
          if (images[0].data) console.log('HAS data field!');
          if (images[0].content?.base64) console.log('HAS content.base64 field!');
          if (images[0].content?.image) console.log('HAS content.image field!');
          if (images[0].src) console.log('HAS src field!');

          console.log('--- END IMAGE ---\n');
        }
      }
    }

    console.log('======================================');

    // Extract text, html, markdown from response
    const content = response.data.content || response.data;
    const extractedText = content.text || '';
    const extractedHtml = content.html || '';
    const extractedMarkdown = content.markdown || '';

    return {
      success: true,
      extractedText: extractedText,
      extractedHtml: extractedHtml,
      extractedJson: extractedMarkdown, // Upstage provides markdown instead of JSON
      structuredData: content,
      processingTime,
      totalTime,
      serverProcessingTime,
      networkLatency,
      rawResponse: response.data
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Upstage API Error:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      errorDetails: error.response?.data,
      processingTime
    };
  }
}

// Interex only endpoint
app.post('/api/compare/interex', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!apiKeys.interex) {
      return res.status(400).json({
        error: 'Interex API key not configured. Please set the API key first.'
      });
    }

    const filePath = req.file.path;
    const result = await callInterexDocumentAI(filePath, apiKeys.interex);

    console.log('=== API RESULT ===');
    console.log('Success:', result.success);
    console.log('Extracted text length:', result.extractedText ? result.extractedText.length : 0);
    console.log('Extracted html length:', result.extractedHtml ? result.extractedHtml.length : 0);
    console.log('Extracted json length:', result.extractedJson ? result.extractedJson.length : 0);
    console.log('==================');

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      filename: req.file.originalname,
      fileSize: req.file.size,
      result
    });

  } catch (error) {
    console.error('Error processing document with Interex:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Upstage only endpoint
app.post('/api/compare/upstage', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!apiKeys.upstage) {
      return res.status(400).json({
        error: 'Upstage API key not configured. Please set the API key first.'
      });
    }

    const filePath = req.file.path;
    const groundTruth = req.body.groundTruth || null;

    const result = await callUpstageDocumentParser(filePath, apiKeys.upstage);

    // Calculate evaluation metrics if ground truth is provided
    if (result.success && groundTruth) {
      result.evaluationMetrics = calculateEvaluationMetrics(
        groundTruth,
        result.extractedText,
        result.rawResponse
      );
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      filename: req.file.originalname,
      fileSize: req.file.size,
      result
    });

  } catch (error) {
    console.error('Error processing document with Upstage:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Document comparison endpoint (both services)
app.post('/api/compare', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!apiKeys.interex || !apiKeys.upstage) {
      return res.status(400).json({
        error: 'API keys not configured. Please set both API keys first.'
      });
    }

    const filePath = req.file.path;

    // Call both APIs in parallel
    const [interexResult, upstageResult] = await Promise.all([
      callInterexDocumentAI(filePath, apiKeys.interex),
      callUpstageDocumentParser(filePath, apiKeys.upstage)
    ]);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      filename: req.file.originalname,
      fileSize: req.file.size,
      interex: interexResult,
      upstage: upstageResult
    });

  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
