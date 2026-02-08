import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoster } from '../hooks/useRoster';
import { apiRequest } from '../utils/api';
import './DashboardPage.css';

/**
 * DashboardPage Component
 * Main dashboard showing user's roster, quick stats, and navigation
 */
export function DashboardPage({ onNavigate }) {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { activeRoster, daysRemaining, isLocked, loading: rosterLoading } = useRoster();
    const [broCallsCount, setBroCallsCount] = useState(0);
    const [stats, setStats] = useState({ threads: 0, friends: 0, posts: 0 });

    useEffect(() => {
        if (!isAuthenticated) return;
        loadStats();
    }, [isAuthenticated]);

    const loadStats = async () => {
        try {
            const [calls, threads, friends] = await Promise.all([
                apiRequest('/brocalls/upcoming').catch(() => []),
                apiRequest('/chat/threads?limit=1').catch(() => []),
                apiRequest('/relationships/friends').catch(() => [])
            ]);
            setBroCallsCount(Array.isArray(calls) ? calls.length : 0);
            setStats({
                threads: Array.isArray(threads) ? threads.length : 0,
                friends: Array.isArray(friends) ? friends.length : 0,
            });
        } catch { /* ignore */ }
    };

    if (!isAuthenticated) {
        return (
            <div className="dashboard-empty">
                <h2>Welcome to The BroVerse</h2>
                <p>Log in to access your dashboard.</p>
                <button className="cta-button" onClick={() => navigate('/profile')}>
                    Login / Register
                </button>
            </div>
        );
    }

    if (rosterLoading) {
        return (
            <div className="dashboard-empty">
                <p style={{ color: '#888' }}>Loading your dashboard...</p>
            </div>
        );
    }

    if (!isLocked) {
        return (
            <div className="dashboard-empty">
                <h2>No Roster Selected</h2>
                <p>You haven't built your roster yet. Choose your crew to get started.</p>
                <button className="cta-button" onClick={() => navigate('/onboarding')}>
                    Build Your Roster
                </button>
            </div>
        );
    }

    const personaSlugs = activeRoster?.personaSlugs || [];

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Your BroVerse</h1>
                <div className="roster-status">
                    🔒 {daysRemaining} days remaining
                </div>
            </div>

            <div className="dashboard-grid">
                <section className="roster-section">
                    <h2>Your Roster</h2>
                    <p className="section-subtitle">Click a character to chat</p>

                    <div className="roster-grid">
                        {personaSlugs.map(slug => (
                            <div
                                key={slug}
                                className="roster-card"
                                onClick={() => navigate('/chat')}
                            >
                                <span className="roster-archetype">{slug.replace(/-/g, ' ')}</span>
                                <h3>{slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</h3>
                                <p className="roster-tagline">Start a conversation</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="stats-section">
                    <h2>Quick Stats</h2>
                    <div className="week-stats">
                        <div className="stat-item">
                            <span className="stat-number">{broCallsCount}</span>
                            <span className="stat-label">Bro Calls Coming</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{daysRemaining}</span>
                            <span className="stat-label">Days in Roster</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.friends}</span>
                            <span className="stat-label">Friends</span>
                        </div>
                    </div>
                </section>

                <section className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-grid">
                        <button className="action-card" onClick={() => navigate('/chat')}>
                            <span className="action-icon">💬</span>
                            <span>Chat with Your Crew</span>
                        </button>
                        <button className="action-card" onClick={() => navigate('/board')}>
                            <span className="action-icon">📋</span>
                            <span>The Board</span>
                        </button>
                        <button className="action-card" onClick={() => navigate('/messages')}>
                            <span className="action-icon">✉️</span>
                            <span>Messages</span>
                        </button>
                        <button className="action-card" onClick={() => navigate('/friends')}>
                            <span className="action-icon">👥</span>
                            <span>Friends</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default DashboardPage;
