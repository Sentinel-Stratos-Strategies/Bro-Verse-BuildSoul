import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { generateCharacterResponse } from './llmService';
import './CharacterChat.css';

/**
 * CharacterChat Component
 * Chat interface for interacting with BroVerse characters
 *
 * Uses real AI API when authenticated, falls back to mock responses when not
 */
export function CharacterChat({ character, onClose }) {
    const { isAuthenticated } = useAuth();
    const { createThread, streamMessage, loading: chatLoading } = useChat();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState(null);
    const [streamingContent, setStreamingContent] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    // Map character to persona slug (e.g., "The Stoic" → "the-stoic")
    const getPersonaSlug = () => {
        if (character.slug) return character.slug;
        const name = character.name || character.archetype || '';
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: input.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // If authenticated, use real AI API with streaming
        if (isAuthenticated) {
            try {
                // Create thread if first message
                let activeThreadId = threadId;
                if (!activeThreadId) {
                    const thread = await createThread(getPersonaSlug());
                    if (thread?.id) {
                        activeThreadId = thread.id;
                        setThreadId(thread.id);
                    }
                }

                if (activeThreadId) {
                    // Stream the AI response
                    setStreamingContent('');
                    let fullContent = '';

                    await streamMessage(activeThreadId, userMessage.content, (chunk) => {
                        fullContent += chunk;
                        setStreamingContent(fullContent);
                    });

                    // Add complete message
                    setStreamingContent('');
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        role: 'character',
                        content: fullContent || 'No response received.',
                        characterName: character.name
                    }]);
                } else {
                    throw new Error('Failed to create thread');
                }
            } catch (error) {
                console.error('AI chat error:', error);
                // Fall back to mock response
                try {
                    const response = await generateCharacterResponse(character, userMessage.content);
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        role: 'character',
                        content: response,
                        characterName: character.name
                    }]);
                } catch {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        role: 'system',
                        content: 'Connection lost. Try again.'
                    }]);
                }
            } finally {
                setIsLoading(false);
            }
        } else {
            // Not authenticated — use mock responses
            try {
                const response = await generateCharacterResponse(character, userMessage.content);
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'character',
                    content: response,
                    characterName: character.name
                }]);
            } catch (error) {
                console.error('Chat error:', error);
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    role: 'system',
                    content: 'Connection lost. Try again.'
                }]);
            } finally {
                setIsLoading(false);
            }
        }
    }, [input, character, isLoading, isAuthenticated, threadId, createThread, streamMessage]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="character-chat">
            <div className="chat-header">
                <div className="chat-character-info">
                    <span className="chat-character-name">{character.name}</span>
                    <span className="chat-character-archetype">{character.archetype}</span>
                </div>
                <button className="chat-close" onClick={onClose}>×</button>
            </div>

            <div className="chat-welcome">
                <p className="chat-tagline">"{character.tagline}"</p>
                <p className="chat-philosophy">{character.philosophy}</p>
            </div>

            <div className="chat-messages">
                {messages.map(msg => (
                    <div key={msg.id} className={`chat-message ${msg.role}`}>
                        {msg.role === 'character' && (
                            <span className="message-author">{msg.characterName}</span>
                        )}
                        <p className="message-content">{msg.content}</p>
                    </div>
                ))}
                {streamingContent && (
                    <div className="chat-message character">
                        <span className="message-author">{character.name}</span>
                        <p className="message-content">
                            {streamingContent}
                            <span className="streaming-cursor">|</span>
                        </p>
                    </div>
                )}
                {isLoading && !streamingContent && (
                    <div className="chat-message character loading">
                        <span className="message-author">{character.name}</span>
                        <p className="message-content">
                            <span className="typing-indicator">
                                <span></span><span></span><span></span>
                            </span>
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={`Ask ${character.name} something...`}
                    rows={2}
                    disabled={isLoading}
                />
                <button
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default CharacterChat;
