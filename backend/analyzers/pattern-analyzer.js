/**
 * Pattern Analyzer
 * Analyzes output patterns to infer model architecture characteristics
 */

class PatternAnalyzer {
  /**
   * Analyze the output structure to infer architecture patterns
   */
  analyzeOutputStructure(response) {
    const analysis = {
      hasElementsArray: false,
      hasPagesArray: false,
      hasCoordinates: false,
      hasHierarchy: false,
      elementTypes: new Set(),
      structureDepth: 0,
      tableDetection: false,
      imageDetection: false,
      chartDetection: false,
    };

    try {
      // Check for elements array (common in layout-aware models)
      if (response.elements && Array.isArray(response.elements)) {
        analysis.hasElementsArray = true;

        response.elements.forEach(element => {
          if (element.type) analysis.elementTypes.add(element.type);
          if (element.coordinates || element.bbox) analysis.hasCoordinates = true;
          if (element.children || element.parent_id) analysis.hasHierarchy = true;
        });

        analysis.tableDetection = Array.from(analysis.elementTypes).some(t =>
          t.toLowerCase().includes('table')
        );
        analysis.imageDetection = Array.from(analysis.elementTypes).some(t =>
          t.toLowerCase().includes('figure') || t.toLowerCase().includes('image')
        );
        analysis.chartDetection = Array.from(analysis.elementTypes).some(t =>
          t.toLowerCase().includes('chart')
        );
      }

      // Check for pages array (common in document-oriented models)
      if (response.pages && Array.isArray(response.pages)) {
        analysis.hasPagesArray = true;
      }

      // Calculate structure depth
      analysis.structureDepth = this.calculateDepth(response);

      // Convert Set to Array for JSON serialization
      analysis.elementTypes = Array.from(analysis.elementTypes);
    } catch (error) {
      console.error('Error in pattern analysis:', error);
    }

    return analysis;
  }

  /**
   * Calculate the depth of nested structure
   */
  calculateDepth(obj, currentDepth = 0) {
    if (!obj || typeof obj !== 'object') return currentDepth;

    let maxDepth = currentDepth;
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        const depth = this.calculateDepth(obj[key], currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }
    return maxDepth;
  }

  /**
   * Infer model architecture type based on patterns
   */
  inferArchitecture(patternAnalysis) {
    const inference = {
      modelType: 'unknown',
      confidence: 0,
      characteristics: [],
      likelyComponents: []
    };

    // Layout-aware transformer model (like LayoutLM, LayoutXLM)
    if (patternAnalysis.hasElementsArray && patternAnalysis.hasCoordinates) {
      inference.modelType = 'layout-aware-transformer';
      inference.confidence = 0.8;
      inference.characteristics.push('Preserves spatial layout information');
      inference.likelyComponents.push('Vision encoder', 'Layout encoder', 'Text decoder');
    }

    // Vision-based model (like Donut, Pix2Struct)
    if (patternAnalysis.hasHierarchy && patternAnalysis.structureDepth > 3) {
      inference.modelType = 'vision-based-transformer';
      inference.confidence = 0.75;
      inference.characteristics.push('Hierarchical structure understanding');
      inference.likelyComponents.push('Vision Transformer (ViT)', 'Decoder');
    }

    // OCR-based pipeline
    if (!patternAnalysis.hasElementsArray && patternAnalysis.hasPagesArray) {
      inference.modelType = 'ocr-pipeline';
      inference.confidence = 0.7;
      inference.characteristics.push('Page-oriented processing');
      inference.likelyComponents.push('OCR engine', 'Text extraction', 'Post-processing');
    }

    // Multi-modal model
    if (patternAnalysis.tableDetection && patternAnalysis.imageDetection) {
      inference.characteristics.push('Multi-modal understanding (text + tables + images)');
      inference.likelyComponents.push('Multi-modal encoder');
    }

    return inference;
  }

  /**
   * Analyze text extraction patterns
   */
  analyzeTextPattern(extractedText) {
    return {
      length: extractedText.length,
      hasFormatting: extractedText.includes('\n\n') || extractedText.includes('\t'),
      hasSpecialChars: /[^\x00-\x7F]/.test(extractedText),
      lineCount: extractedText.split('\n').length,
      avgLineLength: extractedText.length / (extractedText.split('\n').length || 1)
    };
  }
}

module.exports = new PatternAnalyzer();
