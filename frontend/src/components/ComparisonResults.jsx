import ResultPanel from './ResultPanel'

function ComparisonResults({ results, loading }) {
  if (loading) {
    return (
      <div className="loading">
        <h3>문서 처리 중...</h3>
        <p>두 AI 서비스에서 문서를 분석하고 있습니다.</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="no-results">
        <h3>결과가 없습니다</h3>
        <p>문서를 업로드하여 비교를 시작하세요</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>
        비교 결과 - {results.filename}
      </h2>

      <div className="comparison-grid">
        <ResultPanel
          title="Interex Document AI"
          type="interex"
          result={results.interex}
        />

        <ResultPanel
          title="Upstage Document Parser"
          type="upstage"
          result={results.upstage}
        />
      </div>
    </div>
  )
}

export default ComparisonResults
