function ResultPanel({ title, type, result }) {
  if (!result) {
    return (
      <div className="result-panel">
        <div className={`result-header ${type}`}>
          {title}
        </div>
        <div className="result-content">
          <p>결과가 없습니다</p>
        </div>
      </div>
    )
  }

  if (!result.success) {
    return (
      <div className="result-panel">
        <div className={`result-header ${type}`}>
          {title}
        </div>
        <div className="result-content">
          <div className="error">
            <strong>에러 발생:</strong> {result.error}
          </div>
          <div className="metric">
            <div className="metric-label">처리 시간</div>
            <div className="metric-value">{result.processingTime}ms</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="result-panel">
      <div className={`result-header ${type}`}>
        {title}
      </div>
      <div className="result-content">
        {/* Performance Metrics */}
        <div className="metric">
          <div className="metric-label">처리 시간</div>
          <div className="metric-value">{result.processingTime}ms</div>
        </div>

        {/* Extracted Text */}
        {result.extractedText && (
          <div>
            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', color: '#333' }}>
              추출된 텍스트
            </h4>
            <div className="extracted-text">
              {result.extractedText || '텍스트가 추출되지 않았습니다'}
            </div>
          </div>
        )}

        {/* Structured Data */}
        {result.structuredData && Object.keys(result.structuredData).length > 0 && (
          <div>
            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', color: '#333' }}>
              구조화된 데이터
            </h4>
            <div className="structured-data">
              <pre>{JSON.stringify(result.structuredData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultPanel
