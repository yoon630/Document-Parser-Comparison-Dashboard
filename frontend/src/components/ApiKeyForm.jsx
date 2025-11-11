import { useState } from 'react'

function ApiKeyForm({ onSubmit, isSet }) {
  const [interexKey, setInterexKey] = useState('')
  const [upstageKey, setUpstageKey] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (interexKey.trim() && upstageKey.trim()) {
      onSubmit(interexKey, upstageKey)
    }
  }

  return (
    <div className="api-keys-section">
      <h2>API Keys 설정</h2>
      {isSet ? (
        <div className="success">
          API keys가 설정되었습니다. 이제 문서를 업로드할 수 있습니다.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="api-keys-form">
          <div className="form-group">
            <label htmlFor="interex-key">Interex Document AI API Key</label>
            <input
              type="password"
              id="interex-key"
              value={interexKey}
              onChange={(e) => setInterexKey(e.target.value)}
              placeholder="Interex API key를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="upstage-key">Upstage Document Parser API Key</label>
            <input
              type="password"
              id="upstage-key"
              value={upstageKey}
              onChange={(e) => setUpstageKey(e.target.value)}
              placeholder="Upstage API key를 입력하세요"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            저장
          </button>
        </form>
      )}
    </div>
  )
}

export default ApiKeyForm
