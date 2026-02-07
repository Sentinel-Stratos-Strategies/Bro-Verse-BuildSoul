import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

export function ChatSidebar({ threads, activeThreadId, onSelectThread, onNewThread, onArchiveThread, loading }) {
    const [personas, setPersonas] = useState([]);
    const [showNewChat, setShowNewChat] = useState(false);

    useEffect(() => {
        apiRequest('/chat/personas')
            .then(setPersonas)
            .catch(() => {});
    }, []);

    const handleNewChat = (slug) => {
        setShowNewChat(false);
        onNewThread(slug);
    };

    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <h3>Conversations</h3>
                <button
                    className="new-chat-btn"
                    onClick={() => setShowNewChat(!showNewChat)}
                >
                    + New
                </button>
            </div>

            {showNewChat && (
                <div className="persona-picker">
                    <p className="picker-label">Choose a Bro:</p>
                    {personas.map((p) => (
                        <button
                            key={p.slug}
                            className="persona-option"
                            onClick={() => handleNewChat(p.slug)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="thread-list">
                {loading && threads.length === 0 && (
                    <p className="sidebar-loading">Loading...</p>
                )}

                {threads.map((thread) => {
                    const lastMsg = thread.messages?.[0];
                    const personaName = thread.personaSlug
                        ?.split('-')
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');

                    return (
                        <div
                            key={thread.id}
                            className={`thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
                            onClick={() => onSelectThread(thread.id)}
                        >
                            <div className="thread-info">
                                <span className="thread-persona">{personaName}</span>
                                {lastMsg && (
                                    <span className="thread-preview">
                                        {lastMsg.content?.slice(0, 50)}...
                                    </span>
                                )}
                            </div>
                            <button
                                className="archive-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onArchiveThread(thread.id);
                                }}
                                title="Archive"
                            >
                                x
                            </button>
                        </div>
                    );
                })}

                {!loading && threads.length === 0 && !showNewChat && (
                    <p className="no-threads">No conversations yet. Click "+ New" to start.</p>
                )}
            </div>
        </div>
    );
}

export default ChatSidebar;
