import { useState } from 'react'

function DocumentUpload({ onUpload, loading }) {
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedFile) {
      onUpload(selectedFile)
    }
  }

  return (
    <div className="upload-section">
      <h2>문서 업로드</h2>
      <p style={{ marginBottom: '1.5rem', color: '#666' }}>
        PDF, 이미지(JPG/PNG), Office 문서를 업로드하여 두 AI의 성능을 비교하세요
      </p>

      <form onSubmit={handleSubmit}>
        <div className="file-input-wrapper">
          <input
            type="file"
            id="document-upload"
            className="file-input"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            disabled={loading}
          />
          <label htmlFor="document-upload" className="file-label">
            파일 선택
          </label>
        </div>

        {selectedFile && (
          <span className="file-name">
            선택된 파일: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </span>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!selectedFile || loading}
          style={{ marginLeft: '1rem' }}
        >
          {loading ? '처리 중...' : '비교 시작'}
        </button>
      </form>
    </div>
  )
}

export default DocumentUpload
