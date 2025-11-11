/**
 * Signature Mapper
 * Maps input patterns to output patterns for architecture inference
 */

const fs = require('fs').promises;
const path = require('path');

class SignatureMapper {
  constructor() {
    this.signatures = [];
    this.resultsDir = path.join(__dirname, '..', 'results');
  }

  /**
   * Create a signature from input and output
   */
  async createSignature(inputFile, outputAnalysis, modelType) {
    const signature = {
      id: `${modelType}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      modelType: modelType,

      input: {
        filename: inputFile.name,
        fileType: path.extname(inputFile.name),
        fileSize: inputFile.size,
        category: this.categorizeInput(inputFile.name)
      },

      output: {
        patternAnalysis: outputAnalysis.patternAnalysis,
        performanceAnalysis: outputAnalysis.performanceAnalysis,
        tokenAnalysis: outputAnalysis.tokenAnalysis
      },

      inference: {
        architecture: outputAnalysis.architectureInference,
        processingStrategy: outputAnalysis.processingStrategy
      }
    };

    this.signatures.push(signature);
    await this.saveSignature(signature);

    return signature;
  }

  /**
   * Categorize input based on filename
   */
  categorizeInput(filename) {
    const lower = filename.toLowerCase();

    if (lower.includes('table')) return 'simple-table';
    if (lower.includes('rotate')) return 'rotated-images';
    if (lower.includes('formula')) return 'formula-tables';
    if (lower.includes('multi') || lower.includes('lang')) return 'multilingual';

    return 'general';
  }

  /**
   * Save signature to file
   */
  async saveSignature(signature) {
    try {
      // Ensure results directory exists
      await fs.mkdir(this.resultsDir, { recursive: true });

      const filename = `${signature.id}.json`;
      const filepath = path.join(this.resultsDir, filename);

      await fs.writeFile(filepath, JSON.stringify(signature, null, 2));
      console.log(`Signature saved: ${filename}`);
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  }

  /**
   * Compare signatures across models
   */
  compareSignatures(sig1, sig2) {
    return {
      inputMatches: sig1.input.filename === sig2.input.filename,

      performanceDiff: {
        processingTimeDiff: Math.abs(
          sig1.output.performanceAnalysis.processingTime -
          sig2.output.performanceAnalysis.processingTime
        ),
        responseSizeDiff: Math.abs(
          sig1.output.performanceAnalysis.responseSize -
          sig2.output.performanceAnalysis.responseSize
        )
      },

      structuralDiff: {
        elementTypesInSig1: sig1.output.patternAnalysis.elementTypes || [],
        elementTypesInSig2: sig2.output.patternAnalysis.elementTypes || [],
        hasElementsArray: {
          sig1: sig1.output.patternAnalysis.hasElementsArray,
          sig2: sig2.output.patternAnalysis.hasElementsArray
        },
        structureDepth: {
          sig1: sig1.output.patternAnalysis.structureDepth,
          sig2: sig2.output.patternAnalysis.structureDepth
        }
      },

      architectureDiff: {
        sig1Type: sig1.inference.architecture.modelType,
        sig2Type: sig2.inference.architecture.modelType,
        different: sig1.inference.architecture.modelType !== sig2.inference.architecture.modelType
      }
    };
  }

  /**
   * Find patterns across test cases
   */
  findPatterns(category = null) {
    let relevantSignatures = this.signatures;

    if (category) {
      relevantSignatures = this.signatures.filter(sig =>
        sig.input.category === category
      );
    }

    const patterns = {
      byCategory: {},
      byModelType: {},
      commonCharacteristics: []
    };

    // Group by category
    relevantSignatures.forEach(sig => {
      const cat = sig.input.category;
      if (!patterns.byCategory[cat]) {
        patterns.byCategory[cat] = [];
      }
      patterns.byCategory[cat].push(sig);
    });

    // Group by model type
    relevantSignatures.forEach(sig => {
      const model = sig.modelType;
      if (!patterns.byModelType[model]) {
        patterns.byModelType[model] = [];
      }
      patterns.byModelType[model].push(sig);
    });

    return patterns;
  }

  /**
   * Generate analysis report
   */
  generateReport() {
    const patterns = this.findPatterns();

    const report = {
      totalSignatures: this.signatures.length,
      categories: Object.keys(patterns.byCategory).map(cat => ({
        category: cat,
        count: patterns.byCategory[cat].length
      })),
      models: Object.keys(patterns.byModelType).map(model => {
        const sigs = patterns.byModelType[model];
        const avgTime = sigs.reduce((sum, sig) =>
          sum + sig.output.performanceAnalysis.processingTime, 0
        ) / sigs.length;

        return {
          model: model,
          count: sigs.length,
          avgProcessingTime: avgTime.toFixed(2),
          architectureType: sigs[0]?.inference.architecture.modelType || 'unknown'
        };
      })
    };

    return report;
  }

  /**
   * Load all signatures from results directory
   */
  async loadSignatures() {
    try {
      const files = await fs.readdir(this.resultsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filepath = path.join(this.resultsDir, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const signature = JSON.parse(content);
        this.signatures.push(signature);
      }

      console.log(`Loaded ${this.signatures.length} signatures`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading signatures:', error);
      }
    }
  }
}

module.exports = new SignatureMapper();
