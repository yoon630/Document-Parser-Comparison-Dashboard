import { useState, useEffect } from 'react'
import axios from 'axios'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function ModelPanel({ modelType, title, apiEndpoint }) {
  const [apiKey, setApiKey] = useState('')
  const [apiKeySet, setApiKeySet] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [activeTab, setActiveTab] = useState('text')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Helper function to extract LaTeX from HTML and render it
  const renderLatex = (htmlContent) => {
    if (!htmlContent) return null;

    console.log('Original HTML content:', htmlContent);

    // First, extract text from HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    console.log('Extracted text content:', textContent);

    // Extract LaTeX code (remove $ or $$ delimiters)
    // Try double dollar signs first, then single dollar signs
    let latexMatch = textContent.match(/\$\$([\s\S]*?)\$\$/);
    if (!latexMatch) {
      latexMatch = textContent.match(/\$([\s\S]*?)\$/);
    }

    console.log('LaTeX match:', latexMatch);

    if (latexMatch && latexMatch[1]) {
      try {
        const latex = latexMatch[1];
        console.log('LaTeX to render:', latex);
        const rendered = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: true
        });
        console.log('Rendered successfully');
        return rendered;
      } catch (e) {
        console.error('KaTeX rendering error:', e);
        return null;
      }
    }
    console.log('No LaTeX found');
    return null;
  }

  const handleApiKeySubmit = async (e) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      setError('API 키를 입력해주세요')
      return
    }

    try {
      const keyData = modelType === 'interex'
        ? { interexKey: apiKey }
        : { upstageKey: apiKey }

      await axios.post('/api/keys', keyData)
      setApiKeySet(true)
      setError(null)
    } catch (err) {
      setError('API 키 저장에 실패했습니다')
      console.error(err)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedFile) {
      setError('파일을 선택해주세요')
      return
    }

    if (!apiKeySet) {
      setError('먼저 API 키를 설정해주세요')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('document', selectedFile)

      const response = await axios.post(apiEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || '문서 처리에 실패했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`model-panel ${modelType}`}>
      <div className="model-panel-header">
        <h2>{title}</h2>
      </div>

      <div className="model-panel-content">
        {/* API Key Section */}
        <div className="section">
          <h3>1. API Key 설정</h3>
          {apiKeySet ? (
            <div className="success">
              API 키가 설정되었습니다 ✓
            </div>
          ) : (
            <form onSubmit={handleApiKeySubmit} className="api-key-form">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API 키를 입력하세요"
                className="input"
              />
              <button type="submit" className="btn btn-primary">
                저장
              </button>
            </form>
          )}
        </div>

        {/* File Upload Section */}
        <div className="section">
          <h3>2. 문서 업로드</h3>
          <form onSubmit={handleSubmit}>
            <div className="file-upload-area">
              <input
                type="file"
                id={`file-${modelType}`}
                className="file-input"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.hwp,.ppt,.pptx"
                disabled={loading || !apiKeySet}
              />
              <label htmlFor={`file-${modelType}`} className="file-label">
                {selectedFile ? selectedFile.name : '파일 선택'}
              </label>
              {selectedFile && (
                <div className="file-info">
                  크기: {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-run"
              disabled={!selectedFile || loading || !apiKeySet}
            >
              {loading ? '처리 중...' : '실행'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error" style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {error}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="section">
            <h3>3. 결과</h3>

            <div className="result-item">
              <div className="result-label">파일명</div>
              <div className="result-value">{result.filename}</div>
            </div>

            {/* Detailed Timing Information */}
            <div className="result-item">
              <div className="result-label">⏱️ 시간 분석</div>
              <div className="timing-details">
                <div className="timing-row">
                  <span className="timing-label">총 소요시간:</span>
                  <span className="timing-value">{result.result?.totalTime || result.result?.processingTime}ms</span>
                </div>
                <div className="timing-breakdown">
                  <div className="timing-row breakdown">
                    <span className="timing-label">  ├─ 네트워크 대기시간 (Latency):</span>
                    <span className="timing-value">
                      {result.result?.networkLatency !== null && result.result?.networkLatency !== undefined
                        ? `${result.result.networkLatency}ms`
                        : '측정 불가'}
                    </span>
                  </div>
                  <div className="timing-row breakdown">
                    <span className="timing-label">  └─ 순수 처리시간 (Processing):</span>
                    <span className="timing-value">
                      {result.result?.serverProcessingTime !== null && result.result?.serverProcessingTime !== undefined
                        ? `${result.result.serverProcessingTime}ms`
                        : '측정 불가'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {result.result?.success ? (
              <>
                <div className="result-item">
                  <div className="result-label">출력 형태</div>

                  {/* Tab Navigation */}
                  <div className="output-tabs">
                    <button
                      className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
                      onClick={() => setActiveTab('text')}
                    >
                      Text
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'html' ? 'active' : ''}`}
                      onClick={() => setActiveTab('html')}
                    >
                      HTML
                    </button>
                    <button
                      className={`tab-button ${activeTab === 'json' ? 'active' : ''}`}
                      onClick={() => setActiveTab('json')}
                    >
                      {modelType === 'interex' ? 'JSON' : 'Markdown'}
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="tab-content">
                    {activeTab === 'text' && (
                      <div className="extracted-text">
                        {result.result.extractedText || '텍스트가 추출되지 않았습니다'}
                      </div>
                    )}
                    {activeTab === 'html' && (
                      <div className="extracted-text">
                        {result.result.extractedHtml || 'HTML이 추출되지 않았습니다'}
                      </div>
                    )}
                    {activeTab === 'json' && (
                      <div className="extracted-text">
                        {result.result.extractedJson || (modelType === 'interex' ? 'JSON이 추출되지 않았습니다' : 'Markdown이 추출되지 않았습니다')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parsing Results Section */}
                <div className="result-item">
                  <div className="result-label">📊 파싱 결과 분석</div>
                  {(() => {
                    // Extract elements from response
                    let elements = [];

                    // For Interex: try structuredData.result.elements FIRST (has base64_encoding)
                    if (result.result.structuredData?.result?.elements) {
                      elements = result.result.structuredData.result.elements;
                    }
                    // For Interex: elements in result object
                    else if (result.result.rawResponse?.result?.elements) {
                      elements = result.result.rawResponse.result.elements;
                    }
                    // For Upstage: elements at top level
                    else if (result.result.rawResponse?.elements) {
                      elements = result.result.rawResponse.elements;
                    }
                    // Fallback: try structuredData.elements
                    else if (result.result.structuredData?.elements) {
                      elements = result.result.structuredData.elements;
                    }

                    // Additional logging for debugging
                    console.log('Elements extraction debug:', {
                      modelType: modelType,
                      hasRawResponseElements: !!result.result.rawResponse?.elements,
                      hasRawResponseResultElements: !!result.result.rawResponse?.result?.elements,
                      hasStructuredDataResultElements: !!result.result.structuredData?.result?.elements,
                      hasStructuredDataElements: !!result.result.structuredData?.elements,
                      elementsCount: elements.length
                    });

                    if (!elements || elements.length === 0) {
                      return <div className="parsing-empty">파싱된 요소가 없습니다.</div>;
                    }

                    // DEBUG: Show all unique categories and types
                    const allCategories = [...new Set(elements.map(el => el.category))];
                    const allTypes = [...new Set(elements.map(el => el.type))];
                    console.log('🔍 ALL ELEMENT CATEGORIES:', allCategories);
                    console.log('🔍 ALL ELEMENT TYPES:', allTypes);
                    console.log('🔍 SAMPLE ELEMENTS:', elements.slice(0, 5));

                    // Categorize elements
                    const tables = elements.filter(el =>
                      el.category === 'table' || el.type === 'table'
                    );
                    const formulas = elements.filter(el =>
                      el.category === 'equation' || el.category === 'formula' || el.category === 'isolate_formula' ||
                      el.type === 'equation' || el.type === 'formula'
                    );
                    const images = elements.filter(el =>
                      el.category === 'figure' || el.category === 'image' ||
                      el.type === 'figure' || el.type === 'image'
                    );

                    return (
                      <div className="parsing-results">
                        {/* Tables */}
                        {tables.length > 0 && (
                          <div className="parsing-category">
                            <h4>📋 표 ({tables.length}개)</h4>
                            {tables.map((table, idx) => (
                              <div key={idx} className="parsing-item">
                                <div className="parsing-item-header">
                                  표 #{idx + 1} {table.id !== undefined && `(ID: ${table.id})`}
                                  {table.page && ` - Page ${table.page}`}
                                </div>
                                <div className="parsing-item-content">
                                  {/* Check both content.html and direct html field */}
                                  {(table.content?.html || table.html) && (
                                    <div
                                      className="parsing-html"
                                      dangerouslySetInnerHTML={{ __html: table.content?.html || table.html }}
                                    />
                                  )}
                                  {/* Check both content.text and direct text field */}
                                  {(table.content?.text || table.text) && (
                                    <div className="parsing-text">
                                      <strong>텍스트:</strong>
                                      <pre>{table.content?.text || table.text}</pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulas */}
                        {formulas.length > 0 && (
                          <div className="parsing-category">
                            <h4>🔢 수식 ({formulas.length}개)</h4>
                            {formulas.map((formula, idx) => {
                              // Debug: log formula structure
                              console.log('FULL FORMULA OBJECT:', formula);
                              console.log('FORMULA KEYS:', Object.keys(formula));

                              // Check both content.text (for raw LaTeX) and content.html
                              const latexText = formula.content?.text || formula.text;
                              const htmlContent = formula.content?.html || formula.html;
                              console.log('LaTeX text:', latexText);
                              console.log('HTML content for formula:', htmlContent);

                              // If we have raw LaTeX text, render it directly
                              let renderedLatex = null;
                              if (latexText) {
                                try {
                                  renderedLatex = katex.renderToString(latexText, {
                                    throwOnError: false,
                                    displayMode: true
                                  });
                                  console.log('Rendered LaTeX from text successfully');
                                } catch (e) {
                                  console.error('KaTeX rendering error:', e);
                                }
                              } else if (htmlContent) {
                                // Fallback: try to extract LaTeX from HTML
                                renderedLatex = renderLatex(htmlContent);
                              }
                              console.log('Rendered LaTeX:', renderedLatex);

                              return (
                                <div key={idx} className="parsing-item">
                                  <div className="parsing-item-header">
                                    수식 #{idx + 1} {formula.id !== undefined && `(ID: ${formula.id})`}
                                    {formula.page && ` - Page ${formula.page}`}
                                  </div>
                                  <div className="parsing-item-content">
                                    {/* Raw LaTeX Code */}
                                    {(latexText || htmlContent) && (
                                      <div className="parsing-text">
                                        <strong>LaTeX 코드:</strong>
                                        {latexText ? (
                                          <pre style={{ background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', overflow: 'auto' }}>
                                            {latexText}
                                          </pre>
                                        ) : (
                                          <div
                                            className="parsing-html formula"
                                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Rendered Formula */}
                                    {renderedLatex && (
                                      <div className="parsing-text" style={{ marginTop: '1rem' }}>
                                        <strong>렌더링된 수식:</strong>
                                        <div
                                          className="rendered-formula"
                                          dangerouslySetInnerHTML={{ __html: renderedLatex }}
                                        />
                                      </div>
                                    )}

                                    {/* Check both content.text and direct text field */}
                                    {(formula.content?.text || formula.text) && (
                                      <div className="parsing-text" style={{ marginTop: '1rem' }}>
                                        <strong>텍스트:</strong>
                                        <pre>{formula.content?.text || formula.text}</pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Images/Figures */}
                        {images.length > 0 && (
                          <div className="parsing-category">
                            <h4>🖼️ 이미지/도형 ({images.length}개)</h4>
                            {images.map((image, idx) => {
                              // Try to find base64 image data in various possible locations
                              let imageData = null;
                              let imageType = 'png'; // default

                              console.log('Processing image:', {
                                hasBase64Encoding: !!image.base64_encoding,
                                hasBase64: !!image.base64,
                                hasImage: !!image.image,
                                hasData: !!image.data,
                                hasContentBase64Encoding: !!image.content?.base64_encoding,
                                hasContentBase64: !!image.content?.base64,
                                hasSrc: !!image.src,
                                category: image.category,
                                id: image.id
                              });

                              // Log the ENTIRE image object to see what fields it actually has
                              console.log('FULL IMAGE OBJECT:', image);
                              console.log('IMAGE KEYS:', Object.keys(image));

                              // Check for base64 data in different field names
                              if (image.image_base64) {
                                imageData = image.image_base64;
                                console.log('Found image_base64 at top level, length:', imageData?.length);
                              } else if (image.base64_encoding) {
                                imageData = image.base64_encoding;
                                console.log('Found base64_encoding at top level, length:', imageData?.length);
                              } else if (image.base64) {
                                imageData = image.base64;
                                console.log('Found base64 at top level, length:', imageData?.length);
                              } else if (image.image) {
                                imageData = image.image;
                                console.log('Found image at top level, length:', imageData?.length);
                              } else if (image.data) {
                                imageData = image.data;
                                console.log('Found data at top level, length:', imageData?.length);
                              } else if (image.content?.base64_encoding) {
                                imageData = image.content.base64_encoding;
                                console.log('Found base64_encoding in content, length:', imageData?.length);
                              } else if (image.content?.base64) {
                                imageData = image.content.base64;
                                console.log('Found base64 in content, length:', imageData?.length);
                              } else if (image.content?.image) {
                                imageData = image.content.image;
                                console.log('Found image in content, length:', imageData?.length);
                              } else if (image.content?.data) {
                                imageData = image.content.data;
                                console.log('Found data in content, length:', imageData?.length);
                              } else if (image.src) {
                                imageData = image.src;
                                console.log('Found src, value:', imageData?.substring(0, 100));
                              }

                              // Check for image type/format
                              if (image.format) imageType = image.format;
                              else if (image.type && image.type !== 'figure' && image.type !== 'image') {
                                imageType = image.type;
                              }

                              console.log('Final imageData length:', imageData?.length, 'imageType:', imageType);

                              return (
                                <div key={idx} className="parsing-item">
                                  <div className="parsing-item-header">
                                    이미지 #{idx + 1} {image.id !== undefined && `(ID: ${image.id})`}
                                    {image.page && ` - Page ${image.page}`}
                                  </div>
                                  <div className="parsing-item-content">
                                    {image.coordinates && (
                                      <div className="parsing-coordinates">
                                        <strong>좌표:</strong> {JSON.stringify(image.coordinates)}
                                      </div>
                                    )}

                                    {/* Display base64 image if available */}
                                    {imageData && (
                                      <div className="parsing-image-container">
                                        <img
                                          src={imageData.startsWith('data:') ? imageData : `data:image/${imageType};base64,${imageData}`}
                                          alt={`Image ${idx + 1}`}
                                          className="parsing-image"
                                          onError={(e) => {
                                            console.error('Image load error:', e);
                                            e.target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}

                                    {/* Check both content.html and direct html field */}
                                    {(image.content?.html || image.html) && (
                                      <div
                                        className="parsing-html"
                                        dangerouslySetInnerHTML={{ __html: image.content?.html || image.html }}
                                      />
                                    )}

                                    {!imageData && (
                                      <div className="parsing-no-image">
                                        이미지 데이터 없음 (좌표 정보만 사용 가능)
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Summary */}
                        <div className="parsing-summary">
                          <strong>총 {elements.length}개 요소 감지:</strong>
                          표 {tables.length}개, 수식 {formulas.length}개, 이미지 {images.length}개
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="result-item">
                  <div className="result-label">구조화된 데이터</div>
                  <div className="structured-data">
                    <pre>{JSON.stringify(result.result.structuredData, null, 2)}</pre>
                  </div>
                </div>

                {result.result.rawResponse && (
                  <div className="result-item">
                    <div className="result-label">전체 API 응답 (Raw Response)</div>
                    <div className="structured-data">
                      <pre>{JSON.stringify(result.result.rawResponse, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="error" style={{ wordWrap: 'break-word', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <strong>에러:</strong> {result.result?.error}
                {result.result?.errorDetails && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <strong>상세 정보:</strong>
                    <pre style={{
                      marginTop: '0.5rem',
                      background: '#fff',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%',
                      overflowX: 'auto'
                    }}>
                      {JSON.stringify(result.result.errorDetails, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelPanel
