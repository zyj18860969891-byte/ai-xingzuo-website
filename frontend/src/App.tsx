import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Routes>
          <Route path="/*" element={<ChatInterface />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App