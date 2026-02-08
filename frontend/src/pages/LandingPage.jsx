import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

export function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        navigate('/dashboard');
        return null;
    }

    return (
        <div className="landing-page">
            <section className="hero">
                <div className="hero-badge">THE BROVERSE</div>
                <h1>Your Brotherhood.<br />Your Growth.<br /><span className="gold">Your Verse.</span></h1>
                <p className="hero-sub">
                    20 AI-powered masculine archetypes. Real conversations about discipline,
                    purpose, and becoming the man you were meant to be.
                </p>
                <div className="hero-actions">
                    <button className="cta-primary" onClick={() => navigate('/profile')}>
                        Join The BroVerse
                    </button>
                    <button className="cta-secondary" onClick={() => navigate('/board')}>
                        See The Board
                    </button>
                </div>
            </section>

            <section className="features">
                <div className="feature-card">
                    <div className="feature-icon">🗣️</div>
                    <h3>AI-Powered Conversations</h3>
                    <p>Chat with 20 unique masculine archetypes — from The Stoic to The Warrior to The Sage. Each brings a different perspective to your journey.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h3>30-Day Roster Lock</h3>
                    <p>Choose 4 personas for your inner circle. Commit for 30 days. Build real depth with characters who remember you.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">📞</div>
                    <h3>Bro Calls</h3>
                    <p>Your AI bros check in on you 3 times a week with personalized messages — accountability meets brotherhood.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">👥</div>
                    <h3>Real Community</h3>
                    <p>Connect with other men on the same journey. The Board. Direct messages. Challenges. Badges. No toxicity — just growth.</p>
                </div>
            </section>

            <section className="cta-bottom">
                <h2>Ready to build something real?</h2>
                <p>Free to join. No credit card required. Start your first conversation in 60 seconds.</p>
                <button className="cta-primary" onClick={() => navigate('/profile')}>
                    Get Started
                </button>
            </section>
        </div>
    );
}

export default LandingPage;
