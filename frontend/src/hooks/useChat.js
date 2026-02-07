import { useState, useCallback } from 'react';
import { apiRequest, apiStream } from '../utils/api';

export function useChat() {
    const [threads, setThreads] = useState([]);
    const [currentThread, setCurrentThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const createThread = useCallback(async (personaSlug, title) => {
        setLoading(true);
        setError(null);
        try {
            const thread = await apiRequest('/chat/threads', {
                method: 'POST',
                body: { personaSlug, title }
            });
            setCurrentThread(thread);
            setMessages([]);
            return thread;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getThreads = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiRequest('/chat/threads');
            setThreads(data.threads);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getThread = useCallback(async (threadId) => {
        setLoading(true);
        setError(null);
        try {
            const thread = await apiRequest(`/chat/threads/${threadId}`);
            setCurrentThread(thread);
            setMessages(thread.messages || []);
            return thread;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const sendMessage = useCallback(async (threadId, content) => {
        setSending(true);
        setError(null);

        // Optimistic update — add user message immediately
        const tempUserMsg = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const data = await apiRequest(`/chat/threads/${threadId}/messages`, {
                method: 'POST',
                body: { content }
            });

            // Replace temp message with real ones
            setMessages(prev => [
                ...prev.filter(m => m.id !== tempUserMsg.id),
                data.userMessage,
                data.assistantMessage
            ]);

            return data;
        } catch (err) {
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
            setError(err.message);
            throw err;
        } finally {
            setSending(false);
        }
    }, []);

    const streamMessage = useCallback(async (threadId, content, onChunk) => {
        setSending(true);
        setError(null);

        // Add user message
        const tempUserMsg = {
            id: `temp-user-${Date.now()}`,
            role: 'user',
            content,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        // Add placeholder for streaming assistant message
        const tempAssistantMsg = {
            id: `temp-assistant-${Date.now()}`,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
            streaming: true
        };
        setMessages(prev => [...prev, tempAssistantMsg]);

        try {
            const body = await apiStream(
                `/chat/threads/${threadId}/messages/stream`,
                { content }
            );

            const reader = body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'text') {
                            fullContent += data.text;
                            onChunk?.(data.text);
                            // Update the streaming message
                            setMessages(prev =>
                                prev.map(m =>
                                    m.id === tempAssistantMsg.id
                                        ? { ...m, content: fullContent }
                                        : m
                                )
                            );
                        } else if (data.type === 'done') {
                            // Mark as no longer streaming
                            setMessages(prev =>
                                prev.map(m =>
                                    m.id === tempAssistantMsg.id
                                        ? { ...m, streaming: false }
                                        : m
                                )
                            );
                        }
                    } catch {
                        // skip unparseable lines
                    }
                }
            }

            return { content: fullContent };
        } catch (err) {
            setMessages(prev => prev.filter(m =>
                m.id !== tempUserMsg.id && m.id !== tempAssistantMsg.id
            ));
            setError(err.message);
            throw err;
        } finally {
            setSending(false);
        }
    }, []);

    const archiveThread = useCallback(async (threadId) => {
        try {
            await apiRequest(`/chat/threads/${threadId}`, { method: 'DELETE' });
            setThreads(prev => prev.filter(t => t.id !== threadId));
            if (currentThread?.id === threadId) {
                setCurrentThread(null);
                setMessages([]);
            }
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [currentThread]);

    return {
        threads,
        currentThread,
        messages,
        loading,
        sending,
        error,
        createThread,
        getThreads,
        getThread,
        sendMessage,
        streamMessage,
        archiveThread,
        setError
    };
}
