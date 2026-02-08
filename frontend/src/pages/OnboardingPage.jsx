import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRoster } from '../hooks/useRoster';
import { apiRequest } from '../utils/api';
import './OnboardingPage.css';

export function OnboardingPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { lockRoster, isLocked, loading: rosterLoading } = useRoster();
    const [step, setStep] = useState(1);
    const [personas, setPersonas] = useState([]);
    const [selected, setSelected] = useState([]);
    const [locking, setLocking] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/profile'); return; }
        if (isLocked) { navigate('/chat'); return; }
        loadPersonas();
    }, [isAuthenticated, isLocked]);

    const loadPersonas = async () => {
        try {
            const data = await apiRequest('/chat/personas');
            setPersonas(data);
        } catch { /* ignore */ }
    };

    const togglePersona = (slug) => {
        setSelected(prev => {
            if (prev.includes(slug)) return prev.filter(s => s !== slug);
            if (prev.length >= 4) return prev;
            return [...prev, slug];
        });
    };

    const handleLock = async () => {
        if (selected.length === 0) return;
        setLocking(true);
        try {
            await lockRoster(selected);
            setStep(3);
        } catch (err) {
            console.error('Lock failed:', err);
        } finally {
            setLocking(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="onboarding-page">
            {/* Progress */}
            <div className="onboarding-progress">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
                <div className="step-line" />
                <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
                <div className="step-line" />
                <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
            </div>

            {step === 1 && (
                <div className="onboarding-step">
                    <h1>Welcome to The BroVerse, <span className="gold">{user?.displayName || 'King'}</span></h1>
                    <p>You've just entered a space built for men who are serious about growth, accountability, and becoming their best selves.</p>
                    <p>Here's how it works:</p>
                    <ul>
                        <li><strong>Choose your crew</strong> — Pick up to 4 AI personas that match your goals</li>
                        <li><strong>Lock in for 30 days</strong> — Build real depth through consistent conversations</li>
                        <li><strong>Get Bro Calls</strong> — Your crew checks in on you 3 times a week</li>
                        <li><strong>Join the community</strong> — Connect with other men on The Board</li>
                    </ul>
                    <button className="cta-primary" onClick={() => setStep(2)}>Choose Your Crew</button>
                </div>
            )}

            {step === 2 && (
                <div className="onboarding-step">
                    <h2>Pick Your Crew <span className="count">({selected.length}/4)</span></h2>
                    <p>Select 1-4 personas for your 30-day roster. Choose wisely — these will be your go-to conversations.</p>

                    <div className="persona-grid">
                        {personas.map(p => (
                            <div
                                key={p.slug}
                                className={`persona-pick ${selected.includes(p.slug) ? 'selected' : ''} ${selected.length >= 4 && !selected.includes(p.slug) ? 'disabled' : ''}`}
                                onClick={() => togglePersona(p.slug)}
                            >
                                <div className="persona-pick-name">{p.name}</div>
                                <div className="persona-pick-desc">{p.slug.replace(/-/g, ' ')}</div>
                                {selected.includes(p.slug) && <span className="check-mark">✓</span>}
                            </div>
                        ))}
                    </div>

                    {selected.length > 0 && (
                        <button className="cta-primary" onClick={handleLock} disabled={locking}>
                            {locking ? 'Locking...' : `Lock ${selected.length} Persona${selected.length > 1 ? 's' : ''} for 30 Days`}
                        </button>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="onboarding-step onboarding-done">
                    <div className="done-icon">🔥</div>
                    <h1>You're Locked In</h1>
                    <p>Your crew is set for the next 30 days. Time to put in the work.</p>
                    <button className="cta-primary" onClick={() => navigate('/chat')}>Start Your First Conversation</button>
                </div>
            )}
        </div>
    );
}

export default OnboardingPage;
