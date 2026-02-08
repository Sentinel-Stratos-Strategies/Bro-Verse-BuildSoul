import { useEffect, useRef, useState, useCallback } from 'react';
import { getAuthTokens, getApiBaseUrl } from '../utils/api';

export function useWebSocket() {
    const wsRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const listenersRef = useRef(new Map());
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        const tokens = getAuthTokens();
        if (!tokens?.accessToken) return;

        // Build WS URL from API base
        const apiUrl = getApiBaseUrl();
        const wsUrl = apiUrl.replace(/^http/, 'ws') + `?token=${tokens.accessToken}`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                // Clear reconnect timer
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);

                    // Dispatch to type-specific listeners
                    const handlers = listenersRef.current.get(data.type);
                    if (handlers) {
                        for (const handler of handlers) {
                            handler(data);
                        }
                    }
                } catch {
                    // ignore malformed messages
                }
            };

            ws.onclose = () => {
                setConnected(false);
                wsRef.current = null;
                // Auto-reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        } catch {
            // Connection failed, retry
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setConnected(false);
    }, []);

    const send = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, []);

    const sendTyping = useCallback((targetUserId) => {
        send({ type: 'typing', targetUserId, threadType: 'dm' });
    }, [send]);

    /**
     * Subscribe to a specific message type.
     * Returns an unsubscribe function.
     */
    const on = useCallback((type, handler) => {
        if (!listenersRef.current.has(type)) {
            listenersRef.current.set(type, new Set());
        }
        listenersRef.current.get(type).add(handler);

        return () => {
            listenersRef.current.get(type)?.delete(handler);
        };
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();
        return disconnect;
    }, [connect, disconnect]);

    // Listen for auth expiry
    useEffect(() => {
        const handler = () => disconnect();
        window.addEventListener('broverse:auth:expired', handler);
        return () => window.removeEventListener('broverse:auth:expired', handler);
    }, [disconnect]);

    return { connected, lastMessage, send, sendTyping, on, connect, disconnect };
}
