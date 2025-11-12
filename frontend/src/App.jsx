import { useState } from 'react'
import ModelPanel from './components/ModelPanel'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Parsing Solution Compare Dashboard</h1>
        <p>Comparative Analysis of Document Parsing Solutions</p>
      </header>

      <div className="split-container">
        <ModelPanel
          modelType="interex"
          title="Interex Document AI"
          apiEndpoint="/api/compare/interex"
        />

        <ModelPanel
          modelType="upstage"
          title="Upstage Document Parser"
          apiEndpoint="/api/compare/upstage"
        />
      </div>
    </div>
  )
}

export default App
