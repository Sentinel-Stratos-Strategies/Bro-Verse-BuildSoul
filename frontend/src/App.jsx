import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { HomePage, DashboardPage } from './pages'
import { UserProfile } from './components/UserProfile'
import { HealthCheck } from './components/HealthCheck'
import { tracer } from './telemetry'
import './App.css'

/**
 * BroVerse App
 * Main application component with navigation
 */
function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()

  // Track page views on location change
  useEffect(() => {
    const pageName = location.pathname === '/' ? 'Home' 
      : location.pathname === '/dashboard' ? 'Dashboard'
      : location.pathname === '/profile' ? 'Profile'
      : 'Unknown'
    
    tracer.trackPageView(pageName, location.pathname)
    console.log(`Navigated to: ${pageName} (${location.pathname})`)
  }, [location])

  const handleNavigate = (page) => {
    const from = location.pathname
    let to = '/'
    
    switch(page) {
      case 'home':
        to = '/'
        break
      case 'dashboard':
        to = '/dashboard'
        break
      case 'profile':
        to = '/profile'
        break
      default:
        to = '/'
    }
    
    tracer.trackNavigation(from, to, { trigger: 'programmatic' })
    navigate(to)
  }

  return (
    <div className="broverse-app">
      <nav className="app-nav">
        <div className="nav-brand" onClick={() => {
          tracer.trackUserAction('click', 'nav-brand', { destination: '/' })
          navigate('/')
        }}>
          BROVERSE
        </div>
        <div className="nav-links">
          <button onClick={() => {
            tracer.trackUserAction('click', 'nav-home')
            navigate('/')
          }}>Home</button>
          <button onClick={() => {
            tracer.trackUserAction('click', 'nav-dashboard')
            navigate('/dashboard')
          }}>Dashboard</button>
          <button onClick={() => {
            tracer.trackUserAction('click', 'nav-profile')
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
    <Router>
      <AppContent />
      {import.meta.env.DEV && <HealthCheck />}
    </Router>
  )
}

export default App
