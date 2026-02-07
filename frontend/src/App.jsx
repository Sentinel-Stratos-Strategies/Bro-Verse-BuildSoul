import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { HomePage, DashboardPage, BoardPage, ChatPage } from './pages'
import { UserProfile } from './components/UserProfile'
import './App.css'

/**
 * BroVerse App
 * Main application component with navigation
 */
function AppContent() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()

  const handleNavigate = (page) => {
    switch (page) {
      case 'home':
        navigate('/')
        break
      case 'dashboard':
        navigate('/dashboard')
        break
      case 'profile':
        navigate('/profile')
        break
      case 'board':
        navigate('/board')
        break
      case 'chat':
        navigate('/chat')
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
          {isAuthenticated && <button onClick={() => navigate('/chat')}>Chat</button>}
          <button onClick={() => navigate('/board')}>Board</button>
          <button onClick={() => navigate('/profile')}>
            {isAuthenticated ? user?.displayName || 'Profile' : 'Login'}
          </button>
          {isAuthenticated && (
            <button className="logout-btn" onClick={logout}>Logout</button>
          )}
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
          <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:threadId" element={<ChatPage />} />
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
