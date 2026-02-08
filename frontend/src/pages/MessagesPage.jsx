import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiRequest } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './MessagesPage.css';

export function MessagesPage() {
    const { isAuthenticated, user } = useAuth();
    const { on, sendTyping } = useWebSocket();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [activePartner, setActivePartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/profile'); return; }
        loadConversations();
    }, [isAuthenticated]);

    // Listen for incoming DMs
    useEffect(() => {
        const unsub = on('dm', (data) => {
            if (activePartner && data.message.senderId === activePartner.id) {
                setMessages(prev => [...prev, data.message]);
            }
            loadConversations(); // refresh sidebar
        });
        return unsub;
    }, [on, activePartner]);

    // Listen for typing indicators
    useEffect(() => {
        const unsub = on('typing', (data) => {
            if (activePartner && data.fromUserId === activePartner.id) {
                setTyping(true);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
            }
        });
        return unsub;
    }, [on, activePartner]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const data = await apiRequest('/dm/conversations');
            setConversations(data);
        } catch { /* ignore */ }
    };

    const selectPartner = async (partner) => {
        setActivePartner(partner);
        try {
            const data = await apiRequest(`/dm/conversations/${partner.id}`);
            setMessages(data.messages || []);
            // Mark as read
            await apiRequest(`/dm/conversations/${partner.id}/read`, { method: 'POST' });
            loadConversations();
        } catch { /* ignore */ }
    };

    const handleSend = async () => {
        if (!input.trim() || sending || !activePartner) return;
        const content = input.trim();
        setInput('');
        setSending(true);

        // Optimistic
        const temp = { id: `temp-${Date.now()}`, senderId: user.id, content, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, temp]);

        try {
            const msg = await apiRequest(`/dm/conversations/${activePartner.id}`, {
                method: 'POST',
                body: { content }
            });
            setMessages(prev => prev.map(m => m.id === temp.id ? msg : m));
        } catch {
            setMessages(prev => prev.filter(m => m.id !== temp.id));
        } finally {
            setSending(false);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (activePartner) sendTyping(activePartner.id);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="messages-page">
            <div className="conversations-sidebar">
                <h3>Messages</h3>
                {conversations.map(c => (
                    <div
                        key={c.partner?.id}
                        className={`conv-item ${activePartner?.id === c.partner?.id ? 'active' : ''}`}
                        onClick={() => selectPartner(c.partner)}
                    >
                        <div className="conv-name">{c.partner?.displayName}</div>
                        <div className="conv-preview">{c.lastMessage?.content?.slice(0, 40)}</div>
                        {c.unreadCount > 0 && <span className="unread-badge">{c.unreadCount}</span>}
                    </div>
                ))}
                {conversations.length === 0 && <p className="no-convos">No messages yet</p>}
            </div>

            <div className="messages-main">
                {activePartner ? (
                    <>
                        <div className="messages-header">
                            <h3>{activePartner.displayName}</h3>
                        </div>
                        <div className="messages-list">
                            {messages.map(m => (
                                <div key={m.id} className={`dm ${m.senderId === user.id ? 'sent' : 'received'}`}>
                                    <div className="dm-bubble">{m.content}</div>
                                    <span className="dm-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))}
                            {typing && <div className="typing-indicator">typing...</div>}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="dm-input-area">
                            <textarea
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                rows={1}
                            />
                            <button onClick={handleSend} disabled={sending || !input.trim()}>Send</button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessagesPage;
