import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await apiRequest('/auth/forgot-password', {
                method: 'POST',
                body: { email },
                auth: false
            });
            setSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h2>Check Your Email</h2>
                    <p>If an account exists with that email, we've sent a password reset link.</p>
                    <button onClick={() => navigate('/profile')} className="auth-btn">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Reset Password</h2>
                <p>Enter your email and we'll send you a reset link.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="auth-input"
                    />
                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <button onClick={() => navigate('/profile')} className="auth-link">
                    Back to Login
                </button>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;
