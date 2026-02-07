import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import { ChatSidebar } from '../components/Chat/ChatSidebar';
import { ChatThread } from '../components/Chat/ChatThread';
import './ChatPage.css';

export function ChatPage() {
    const { threadId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const {
        threads, currentThread, messages, loading, sending, error,
        createThread, getThreads, getThread, streamMessage, archiveThread, setError
    } = useChat();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/profile');
            return;
        }
        getThreads().catch(() => {});
    }, [isAuthenticated]);

    useEffect(() => {
        if (threadId) {
            getThread(threadId).catch(() => {});
        }
    }, [threadId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleNewThread = async (personaSlug) => {
        try {
            const thread = await createThread(personaSlug);
            navigate(`/chat/${thread.id}`);
        } catch {
            // error handled by hook
        }
    };

    const handleSend = async () => {
        if (!input.trim() || sending || !currentThread) return;
        const content = input.trim();
        setInput('');

        try {
            await streamMessage(currentThread.id, content);
        } catch {
            // error handled by hook
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleArchive = async (id) => {
        try {
            await archiveThread(id);
            if (threadId === id) navigate('/chat');
        } catch {
            // error handled by hook
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="chat-page">
            <ChatSidebar
                threads={threads}
                activeThreadId={threadId}
                onSelectThread={(id) => navigate(`/chat/${id}`)}
                onNewThread={handleNewThread}
                onArchiveThread={handleArchive}
                loading={loading}
            />

            <div className="chat-main">
                {currentThread ? (
                    <>
                        <div className="chat-header">
                            <h2>{currentThread.personaSlug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h2>
                            {currentThread.title && <span className="chat-title">{currentThread.title}</span>}
                        </div>

                        <ChatThread messages={messages} />
                        <div ref={messagesEndRef} />

                        {error && (
                            <div className="chat-error" onClick={() => setError(null)}>
                                {error} (click to dismiss)
                            </div>
                        )}

                        <div className="chat-input-area">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                disabled={sending}
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !input.trim()}
                                className="send-button"
                            >
                                {sending ? '...' : 'Send'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="chat-empty">
                        <h2>Select a conversation or start a new one</h2>
                        <p>Choose a Bro from the sidebar to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatPage;
