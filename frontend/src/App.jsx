import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { ToastProvider } from './components/shared/Toast'
import { HomePage, DashboardPage, BoardPage, ChatPage, MessagesPage, FriendsPage, LandingPage, OnboardingPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './pages'
import { UserProfile } from './components/UserProfile'
import { BroCallOverlay } from './components/BroCalls/BroCallOverlay'
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
      case 'messages':
        navigate('/messages')
        break
      case 'friends':
        navigate('/friends')
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
          {isAuthenticated && <button onClick={() => navigate('/dashboard')}>Dashboard</button>}
          {isAuthenticated && <button onClick={() => navigate('/chat')}>Chat</button>}
          {isAuthenticated && <button onClick={() => navigate('/messages')}>Messages</button>}
          {isAuthenticated && <button onClick={() => navigate('/friends')}>Friends</button>}
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
          <Route path="/" element={isAuthenticated ? <DashboardPage onNavigate={handleNavigate} /> : <LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:threadId" element={<ChatPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </main>

      {isAuthenticated && <BroCallOverlay />}

      <footer className="app-footer">
        <p>The BroVerse • Built by The Sentinel • Sacred Construction</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
