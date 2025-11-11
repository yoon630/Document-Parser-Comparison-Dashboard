/**
 * Metadata Analyzer
 * Analyzes latency, response size, and performance characteristics
 */

class MetadataAnalyzer {
  constructor() {
    this.performanceHistory = [];
  }

  /**
   * Analyze performance metadata
   */
  analyzePerformance(metadata) {
    const analysis = {
      processingTime: metadata.processingTime,
      responseSize: metadata.responseSize,
      timestamp: new Date().toISOString(),

      // Latency analysis
      latencyCategory: this.categorizeLatency(metadata.processingTime),

      // Response size analysis
      sizeCategory: this.categorizeSize(metadata.responseSize),

      // Efficiency score (lower is better)
      efficiencyScore: this.calculateEfficiency(metadata.processingTime, metadata.responseSize)
    };

    // Store in history
    this.performanceHistory.push(analysis);

    return analysis;
  }

  /**
   * Categorize latency
   */
  categorizeLatency(processingTime) {
    if (processingTime < 1000) return 'fast';
    if (processingTime < 5000) return 'medium';
    if (processingTime < 15000) return 'slow';
    return 'very-slow';
  }

  /**
   * Categorize response size
   */
  categorizeSize(bytes) {
    const kb = bytes / 1024;
    if (kb < 10) return 'small';
    if (kb < 100) return 'medium';
    if (kb < 1000) return 'large';
    return 'very-large';
  }

  /**
   * Calculate efficiency score
   * Lower score = better efficiency (faster processing, smaller response)
   */
  calculateEfficiency(processingTime, responseSize) {
    // Normalize: processing time in seconds, size in KB
    const timeScore = processingTime / 1000;
    const sizeScore = (responseSize / 1024) / 100; // Normalize to similar scale

    return (timeScore + sizeScore).toFixed(2);
  }

  /**
   * Analyze token patterns in response
   */
  analyzeTokenPatterns(response) {
    const analysis = {
      totalKeys: 0,
      arrayCount: 0,
      objectCount: 0,
      maxArrayLength: 0,
      dataTypes: new Set()
    };

    const traverse = (obj) => {
      if (Array.isArray(obj)) {
        analysis.arrayCount++;
        analysis.maxArrayLength = Math.max(analysis.maxArrayLength, obj.length);
        obj.forEach(item => traverse(item));
      } else if (typeof obj === 'object' && obj !== null) {
        analysis.objectCount++;
        Object.keys(obj).forEach(key => {
          analysis.totalKeys++;
          const value = obj[key];
          analysis.dataTypes.add(typeof value);
          traverse(value);
        });
      }
    };

    traverse(response);

    analysis.dataTypes = Array.from(analysis.dataTypes);
    analysis.complexity = this.calculateComplexity(analysis);

    return analysis;
  }

  /**
   * Calculate response complexity
   */
  calculateComplexity(tokenAnalysis) {
    const score =
      (tokenAnalysis.totalKeys * 0.5) +
      (tokenAnalysis.arrayCount * 2) +
      (tokenAnalysis.objectCount * 1.5) +
      (tokenAnalysis.maxArrayLength * 0.1);

    if (score < 50) return 'simple';
    if (score < 200) return 'moderate';
    if (score < 500) return 'complex';
    return 'very-complex';
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.performanceHistory.length === 0) {
      return null;
    }

    const times = this.performanceHistory.map(p => p.processingTime);
    const sizes = this.performanceHistory.map(p => p.responseSize);

    return {
      count: this.performanceHistory.length,
      avgProcessingTime: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
      minProcessingTime: Math.min(...times),
      maxProcessingTime: Math.max(...times),
      avgResponseSize: (sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(2),
      minResponseSize: Math.min(...sizes),
      maxResponseSize: Math.max(...sizes)
    };
  }

  /**
   * Infer processing strategy from metadata
   */
  inferProcessingStrategy(performanceAnalysis, tokenAnalysis) {
    const inference = {
      strategy: 'unknown',
      reasoning: []
    };

    // Fast processing + simple response = lightweight model
    if (performanceAnalysis.latencyCategory === 'fast' && tokenAnalysis.complexity === 'simple') {
      inference.strategy = 'lightweight-processing';
      inference.reasoning.push('Fast response time with simple structure suggests optimized pipeline');
    }

    // Slow processing + complex response = heavy model
    if (performanceAnalysis.latencyCategory === 'slow' && tokenAnalysis.complexity === 'complex') {
      inference.strategy = 'comprehensive-analysis';
      inference.reasoning.push('Longer processing time with detailed output suggests thorough document understanding');
    }

    // Large response size
    if (performanceAnalysis.sizeCategory === 'large' || performanceAnalysis.sizeCategory === 'very-large') {
      inference.reasoning.push('Large response indicates detailed metadata and coordinates preservation');
    }

    // Multiple arrays suggest structured extraction
    if (tokenAnalysis.arrayCount > 5) {
      inference.reasoning.push('Multiple arrays suggest element-wise structured extraction');
    }

    return inference;
  }
}

module.exports = new MetadataAnalyzer();
