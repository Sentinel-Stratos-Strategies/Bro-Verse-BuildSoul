import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        apiRequest('/auth/verify-email', {
            method: 'POST',
            body: { token },
            auth: false
        })
            .then(() => {
                setStatus('success');
                setMessage('Your email has been verified!');
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err.message || 'Verification failed.');
            });
    }, [token]);

    return (
        <div className="auth-page">
            <div className="auth-card">
                {status === 'verifying' && (
                    <>
                        <h2>Verifying...</h2>
                        <p>Please wait while we verify your email.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h2>Email Verified</h2>
                        <p>{message}</p>
                        <button onClick={() => navigate('/dashboard')} className="auth-btn">
                            Go to Dashboard
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2>Verification Failed</h2>
                        <p>{message}</p>
                        <button onClick={() => navigate('/profile')} className="auth-btn">
                            Go to Profile
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default VerifyEmailPage;
