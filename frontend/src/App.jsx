import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { HomePage, DashboardPage, EvaluationPage } from './pages'
import { UserProfile } from './components/UserProfile'
import './App.css'

/**
 * BroVerse App
 * Main application component with navigation
 */
function AppContent() {
  const navigate = useNavigate()

  const handleNavigate = (page) => {
    switch(page) {
      case 'home':
        navigate('/')
        break
      case 'dashboard':
        navigate('/dashboard')
        break
      case 'profile':
        navigate('/profile')
        break
      case 'evaluation':
        navigate('/evaluation')
        break
      default:
        navigate('/')
    }
  }

  return (
    <div className="broverse-app">
      <nav className="app-nav">
        <div className="nav-brand" onClick={() => navigate('/')}>
          BROVERSE
        </div>
        <div className="nav-links">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button onClick={() => navigate('/profile')}>Profile</button>
          <button onClick={() => navigate('/evaluation')}>Evaluation</button>
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
          <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/evaluation" element={<EvaluationPage />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>The BroVerse • Built by The Sentinel • Sacred Construction</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
