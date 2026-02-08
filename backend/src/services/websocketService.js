import { WebSocketServer } from 'ws';
import { verifyAccessToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

/** Map<userId, Set<WebSocket>> */
const clients = new Map();

/** Map<userId, 'online'|'away'> */
const presence = new Map();

/**
 * Attach a WebSocket server to an existing HTTP server.
 * Auth via ?token= query param on upgrade.
 */
export function attachWebSocket(server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        const payload = verifyAccessToken(token);
        if (!payload) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            ws.userId = payload.sub;
            ws.displayName = payload.displayName;
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', (ws) => {
        const userId = ws.userId;

        // Track connection
        if (!clients.has(userId)) {
            clients.set(userId, new Set());
        }
        clients.get(userId).add(ws);
        presence.set(userId, 'online');

        logger.info('WebSocket connected', { userId });

        // Broadcast presence
        broadcastPresence(userId, 'online');

        ws.on('message', (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                handleMessage(userId, msg);
            } catch {
                // ignore malformed messages
            }
        });

        ws.on('close', () => {
            const userSockets = clients.get(userId);
            if (userSockets) {
                userSockets.delete(ws);
                if (userSockets.size === 0) {
                    clients.delete(userId);
                    presence.set(userId, 'offline');
                    broadcastPresence(userId, 'offline');
                }
            }
            logger.info('WebSocket disconnected', { userId });
        });

        ws.on('error', (err) => {
            logger.error('WebSocket error', { userId, error: err.message });
        });
    });

    return wss;
}

function handleMessage(userId, msg) {
    switch (msg.type) {
        case 'typing':
            // Forward typing indicator to target user
            sendToUser(msg.targetUserId, {
                type: 'typing',
                fromUserId: userId,
                threadType: msg.threadType || 'dm'
            });
            break;

        case 'ping':
            // Keep-alive
            sendToUser(userId, { type: 'pong' });
            break;

        default:
            break;
    }
}

/**
 * Send a message to all sockets of a specific user.
 */
export function sendToUser(userId, data) {
    const userSockets = clients.get(userId);
    if (!userSockets) return;

    const payload = JSON.stringify(data);
    for (const ws of userSockets) {
        if (ws.readyState === 1) {
            ws.send(payload);
        }
    }
}

/**
 * Broadcast a message to multiple users.
 */
export function broadcast(userIds, data) {
    for (const userId of userIds) {
        sendToUser(userId, data);
    }
}

/**
 * Broadcast presence change.
 */
function broadcastPresence(userId, status) {
    // In production, broadcast only to friends. For now, skip mass broadcast.
    // This will be refined when friend list is integrated.
}

/**
 * Check if a user is online.
 */
export function isOnline(userId) {
    return clients.has(userId) && clients.get(userId).size > 0;
}

/**
 * Get all online user IDs.
 */
export function getOnlineUsers() {
    return [...clients.keys()];
}
