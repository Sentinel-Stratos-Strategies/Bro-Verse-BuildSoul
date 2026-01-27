import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { HomePage, DashboardPage } from './pages'
import { UserProfile } from './components/UserProfile'
import { ErrorBoundary, trackNavigation, trackUserAction, useComponentTracking } from './telemetry'
import './App.css'

/**
 * BroVerse App
 * Main application component with navigation
 */
function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Track component lifecycle
  useComponentTracking('AppContent')

  // Track route changes
  useEffect(() => {
    // Note: On first load, we don't have a previous path
    trackNavigation('', location.pathname)
  }, [location.pathname])

  const handleNavigate = (page) => {
    const currentPath = location.pathname
    let targetPath = '/'
    
    switch(page) {
      case 'home':
        targetPath = '/'
        break
      case 'dashboard':
        targetPath = '/dashboard'
        break
      case 'profile':
        targetPath = '/profile'
        break
      default:
        targetPath = '/'
    }
    
    trackNavigation(currentPath, targetPath)
    navigate(targetPath)
  }

  return (
    <div className="broverse-app">
      <nav className="app-nav">
        <div 
          className="nav-brand" 
          onClick={() => {
            trackUserAction('click', 'nav-brand')
            navigate('/')
          }}
        >
          BROVERSE
        </div>
        <div className="nav-links">
          <button onClick={() => {
            trackUserAction('click', 'nav-home')
            navigate('/')
          }}>Home</button>
          <button onClick={() => {
            trackUserAction('click', 'nav-dashboard')
            navigate('/dashboard')
          }}>Dashboard</button>
          <button onClick={() => {
            trackUserAction('click', 'nav-profile')
            navigate('/profile')
          }}>Profile</button>
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
          <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
          <Route path="/profile" element={<UserProfile />} />
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
    <ErrorBoundary name="App">
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  )
}

export default App
