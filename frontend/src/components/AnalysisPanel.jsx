/**
 * AnalysisPanel Component
 * Displays black-box analysis results including architecture inference,
 * performance metrics, and pattern analysis
 */

function AnalysisPanel({ analysis, modelType }) {
  if (!analysis) {
    return null;
  }

  const {
    architectureInference,
    performanceAnalysis,
    patternAnalysis,
    textPattern,
    tokenAnalysis,
    processingStrategy
  } = analysis;

  return (
    <div className="analysis-panel">
      <h3>🔍 Black-Box Analysis</h3>

      {/* Architecture Inference */}
      {architectureInference && (
        <div className="analysis-section">
          <h4>🏗️ Inferred Architecture</h4>
          <div className="analysis-item">
            <span className="label">Model Type:</span>
            <span className="value">
              {architectureInference.modelType}
              <span className="confidence"> ({(architectureInference.confidence * 100).toFixed(0)}% confidence)</span>
            </span>
          </div>

          {architectureInference.characteristics && architectureInference.characteristics.length > 0 && (
            <div className="analysis-item">
              <span className="label">Characteristics:</span>
              <ul className="characteristics-list">
                {architectureInference.characteristics.map((char, idx) => (
                  <li key={idx}>{char}</li>
                ))}
              </ul>
            </div>
          )}

          {architectureInference.likelyComponents && architectureInference.likelyComponents.length > 0 && (
            <div className="analysis-item">
              <span className="label">Likely Components:</span>
              <div className="components-tags">
                {architectureInference.likelyComponents.map((comp, idx) => (
                  <span key={idx} className="component-tag">{comp}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Analysis */}
      {performanceAnalysis && (
        <div className="analysis-section">
          <h4>⚡ Performance Metrics</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Processing Time</div>
              <div className="metric-value">{performanceAnalysis.processingTime}ms</div>
              <div className="metric-category">{performanceAnalysis.latencyCategory}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Response Size</div>
              <div className="metric-value">{(performanceAnalysis.responseSize / 1024).toFixed(2)} KB</div>
              <div className="metric-category">{performanceAnalysis.sizeCategory}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Efficiency Score</div>
              <div className="metric-value">{performanceAnalysis.efficiencyScore}</div>
              <div className="metric-category">lower is better</div>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Analysis */}
      {patternAnalysis && (
        <div className="analysis-section">
          <h4>🧩 Structure Pattern Analysis</h4>
          <div className="pattern-grid">
            <div className="pattern-item">
              <span className="pattern-label">Elements Array:</span>
              <span className={`pattern-value ${patternAnalysis.hasElementsArray ? 'yes' : 'no'}`}>
                {patternAnalysis.hasElementsArray ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="pattern-item">
              <span className="pattern-label">Pages Array:</span>
              <span className={`pattern-value ${patternAnalysis.hasPagesArray ? 'yes' : 'no'}`}>
                {patternAnalysis.hasPagesArray ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="pattern-item">
              <span className="pattern-label">Coordinates:</span>
              <span className={`pattern-value ${patternAnalysis.hasCoordinates ? 'yes' : 'no'}`}>
                {patternAnalysis.hasCoordinates ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="pattern-item">
              <span className="pattern-label">Hierarchy:</span>
              <span className={`pattern-value ${patternAnalysis.hasHierarchy ? 'yes' : 'no'}`}>
                {patternAnalysis.hasHierarchy ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            <div className="pattern-item">
              <span className="pattern-label">Structure Depth:</span>
              <span className="pattern-value">{patternAnalysis.structureDepth}</span>
            </div>
          </div>

          {patternAnalysis.elementTypes && patternAnalysis.elementTypes.length > 0 && (
            <div className="analysis-item" style={{ marginTop: '1rem' }}>
              <span className="label">Detected Element Types:</span>
              <div className="element-types-tags">
                {patternAnalysis.elementTypes.map((type, idx) => (
                  <span key={idx} className="element-type-tag">{type}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detection-grid" style={{ marginTop: '1rem' }}>
            <div className={`detection-item ${patternAnalysis.tableDetection ? 'detected' : ''}`}>
              📊 Table Detection: {patternAnalysis.tableDetection ? '✓' : '✗'}
            </div>
            <div className={`detection-item ${patternAnalysis.imageDetection ? 'detected' : ''}`}>
              🖼️ Image Detection: {patternAnalysis.imageDetection ? '✓' : '✗'}
            </div>
            <div className={`detection-item ${patternAnalysis.chartDetection ? 'detected' : ''}`}>
              📈 Chart Detection: {patternAnalysis.chartDetection ? '✓' : '✗'}
            </div>
          </div>
        </div>
      )}

      {/* Processing Strategy */}
      {processingStrategy && (
        <div className="analysis-section">
          <h4>🎯 Inferred Processing Strategy</h4>
          <div className="analysis-item">
            <span className="label">Strategy:</span>
            <span className="value strategy-badge">{processingStrategy.strategy}</span>
          </div>
          {processingStrategy.reasoning && processingStrategy.reasoning.length > 0 && (
            <div className="analysis-item">
              <span className="label">Reasoning:</span>
              <ul className="reasoning-list">
                {processingStrategy.reasoning.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Token Analysis */}
      {tokenAnalysis && (
        <div className="analysis-section">
          <h4>🔢 Response Complexity Analysis</h4>
          <div className="token-grid">
            <div className="token-item">
              <span className="token-label">Total Keys:</span>
              <span className="token-value">{tokenAnalysis.totalKeys}</span>
            </div>
            <div className="token-item">
              <span className="token-label">Arrays:</span>
              <span className="token-value">{tokenAnalysis.arrayCount}</span>
            </div>
            <div className="token-item">
              <span className="token-label">Objects:</span>
              <span className="token-value">{tokenAnalysis.objectCount}</span>
            </div>
            <div className="token-item">
              <span className="token-label">Max Array Length:</span>
              <span className="token-value">{tokenAnalysis.maxArrayLength}</span>
            </div>
            <div className="token-item full-width">
              <span className="token-label">Complexity:</span>
              <span className={`token-value complexity-badge complexity-${tokenAnalysis.complexity}`}>
                {tokenAnalysis.complexity}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisPanel;
