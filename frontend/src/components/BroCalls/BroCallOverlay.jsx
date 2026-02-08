import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiRequest } from '../../utils/api';
import './BroCallOverlay.css';

/**
 * BroCallOverlay - Shows incoming Bro Calls as a notification overlay
 * Sits globally in the app and listens for WebSocket bro_call events
 */
export function BroCallOverlay() {
    const { on } = useWebSocket();
    const [activeCall, setActiveCall] = useState(null);
    const [visible, setVisible] = useState(false);

    // Listen for incoming bro calls via WebSocket
    useEffect(() => {
        const unsub = on('bro_call', (data) => {
            setActiveCall(data.broCall);
            setVisible(true);
        });
        return unsub;
    }, [on]);

    // Also check for active calls on mount
    useEffect(() => {
        checkActiveCalls();
    }, []);

    const checkActiveCalls = async () => {
        try {
            const calls = await apiRequest('/brocalls/active');
            if (calls.length > 0) {
                setActiveCall(calls[0]);
                setVisible(true);
            }
        } catch { /* ignore */ }
    };

    const handleSeen = async () => {
        if (!activeCall) return;
        try {
            await apiRequest(`/brocalls/${activeCall.id}/seen`, { method: 'POST' });
        } catch { /* ignore */ }
        dismiss();
    };

    const handleDismiss = async () => {
        if (!activeCall) return;
        try {
            await apiRequest(`/brocalls/${activeCall.id}/miss`, { method: 'POST' });
        } catch { /* ignore */ }
        dismiss();
    };

    const dismiss = () => {
        setVisible(false);
        setTimeout(() => setActiveCall(null), 300);
    };

    if (!activeCall) return null;

    return (
        <div className={`bro-call-overlay ${visible ? 'visible' : 'hidden'}`}>
            <div className="bro-call-card">
                <div className="bro-call-header">
                    <span className="bro-call-badge">BRO CALL</span>
                    <button className="bro-call-dismiss" onClick={handleDismiss}>×</button>
                </div>
                <div className="bro-call-persona">
                    {activeCall.personaSlug?.replace(/-/g, ' ') || 'Your Bro'}
                </div>
                <div className="bro-call-message">
                    {activeCall.message}
                </div>
                <div className="bro-call-actions">
                    <button className="bro-call-answer" onClick={handleSeen}>
                        I'm Here 💪
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BroCallOverlay;
