import { useState } from 'react';
import './UserProfile.css';

// Helper to get initial state from localStorage
function getInitialProfileState() {
  const storedUser = localStorage.getItem('broverse_user');
  const storedRoster = localStorage.getItem('broverse_roster');
  const storedExpiry = localStorage.getItem('broverse_roster_expiry');
  const storedStats = localStorage.getItem('broverse_stats');

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    roster: storedRoster ? JSON.parse(storedRoster) : null,
    rosterExpiry: storedExpiry ? new Date(storedExpiry) : null,
    stats: storedStats ? JSON.parse(storedStats) : {
      callsReceived: 0,
      rostersCompleted: 0,
      daysActive: 0
    }
  };
}

/**
 * UserProfile Component
 * Manages user account and displays their current roster
 */
export function UserProfile({ onLogout }) {
  const initialState = getInitialProfileState();
  const [user, setUser] = useState(initialState.user);
  const [roster] = useState(initialState.roster);
  const [rosterExpiry] = useState(initialState.rosterExpiry);
  const [stats] = useState(initialState.stats);

  const getDaysRemaining = () => {
    if (!rosterExpiry) return 0;
    const now = new Date();
    const diff = rosterExpiry - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const handleLogout = () => {
    localStorage.removeItem('broverse_user');
    setUser(null);
    onLogout?.();
  };

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.name?.charAt(0) || 'B'}
        </div>
        <div className="profile-info">
          <h2>{user.name || 'Brother'}</h2>
          <p className="profile-tagline">{user.tagline || 'Building something real.'}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.callsReceived}</span>
          <span className="stat-label">Bro Calls Received</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.rostersCompleted}</span>
          <span className="stat-label">Rosters Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.daysActive}</span>
          <span className="stat-label">Days Active</span>
        </div>
      </div>

      {roster && (
        <div className="current-roster">
          <div className="roster-header">
            <h3>Current Roster</h3>
            {rosterExpiry && (
              <span className="roster-timer">
                🔒 {getDaysRemaining()} days remaining
              </span>
            )}
          </div>

          <div className="roster-characters">
            {roster.prebuilt?.map(char => (
              <div key={char.id} className="roster-character">
                <span className="roster-char-name">{char.name}</span>
                <span className="roster-char-archetype">{char.archetype}</span>
              </div>
            ))}
            {roster.alphaBro && (
              <div className="roster-character alpha">
                <span className="roster-char-name">{roster.alphaBro.name}</span>
                <span className="roster-char-archetype">Alpha Bro</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="profile-section">
        <h3>Settings</h3>
        <div className="settings-list">
          <div className="setting-item">
            <span>Bro Calls</span>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <span>Notifications</span>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LoginForm Component
 * Simple login/signup form
 */
function LoginForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tagline, setTagline] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const user = {
      id: Date.now(),
      name: name || 'Brother',
      email,
      tagline: tagline || 'Building something real.',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('broverse_user', JSON.stringify(user));
    
    // Initialize stats for new user
    if (!isLogin) {
      localStorage.setItem('broverse_stats', JSON.stringify({
        callsReceived: 0,
        rostersCompleted: 0,
        daysActive: 1
      }));
    }

    onLogin(user);
  };

  return (
    <div className="login-form-container">
      <div className="login-form">
        <h2>{isLogin ? 'Welcome Back, Brother' : 'Join the BroVerse'}</h2>
        <p className="login-subtitle">
          {isLogin 
            ? 'You\'ve been called. Step back in.' 
            : 'This isn\'t therapy. It\'s sacred construction.'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What should we call you?"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Your Tagline (optional)</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="What's your battle cry?"
              />
            </div>
          )}

          <button type="submit" className="submit-btn">
            {isLogin ? 'Enter the BroVerse' : 'Begin Your Journey'}
          </button>
        </form>

        <p className="toggle-form">
          {isLogin ? "Don't have an account? " : 'Already a brother? '}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Join now' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default UserProfile;
