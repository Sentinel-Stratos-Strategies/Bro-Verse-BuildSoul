import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sanitizeString } from '../utils/sanitize.js';
import { sendToUser } from '../services/websocketService.js';
import logger from '../utils/logger.js';

const router = Router();
router.use(requireAuth);

// ── GET /dm/conversations — List conversations with last message ────
router.get('/conversations', async (req, res, next) => {
    try {
        const userId = req.user.sub;

        // Get distinct conversation partners
        const sent = await prisma.directMessage.findMany({
            where: { senderId: userId },
            select: { receiverId: true },
            distinct: ['receiverId']
        });
        const received = await prisma.directMessage.findMany({
            where: { receiverId: userId },
            select: { senderId: true },
            distinct: ['senderId']
        });

        const partnerIds = [...new Set([
            ...sent.map(m => m.receiverId),
            ...received.map(m => m.senderId)
        ])];

        // For each partner, get last message and unread count
        const conversations = await Promise.all(
            partnerIds.map(async (partnerId) => {
                const lastMessage = await prisma.directMessage.findFirst({
                    where: {
                        OR: [
                            { senderId: userId, receiverId: partnerId },
                            { senderId: partnerId, receiverId: userId }
                        ]
                    },
                    orderBy: { createdAt: 'desc' }
                });

                const unreadCount = await prisma.directMessage.count({
                    where: {
                        senderId: partnerId,
                        receiverId: userId,
                        isRead: false
                    }
                });

                const partner = await prisma.user.findUnique({
                    where: { id: partnerId },
                    select: { id: true, displayName: true, avatarUrl: true }
                });

                return {
                    partner,
                    lastMessage,
                    unreadCount
                };
            })
        );

        // Sort by last message time
        conversations.sort((a, b) =>
            (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0)
        );

        res.json(conversations);
    } catch (err) {
        next(err);
    }
});

// ── GET /dm/conversations/:userId — Messages with user (paginated) ──
router.get('/conversations/:userId', async (req, res, next) => {
    try {
        const myId = req.user.sub;
        const partnerId = req.params.userId;
        const cursor = req.query.cursor;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);

        const messages = await prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: myId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 })
        });

        const hasMore = messages.length > limit;
        if (hasMore) messages.pop();

        res.json({
            messages: messages.reverse(),
            nextCursor: hasMore ? messages[0]?.id : null
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /dm/conversations/:userId — Send DM ───────────────────────
router.post('/conversations/:userId', async (req, res, next) => {
    try {
        const myId = req.user.sub;
        const receiverId = req.params.userId;
        const { content } = req.body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        if (myId === receiverId) {
            return res.status(400).json({ error: 'Cannot message yourself' });
        }

        // Check receiver exists
        const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
        if (!receiver) {
            return res.status(404).json({ error: 'User not found' });
        }

        const message = await prisma.directMessage.create({
            data: {
                senderId: myId,
                receiverId,
                content: sanitizeString(content.trim())
            }
        });

        // Send real-time notification via WebSocket
        sendToUser(receiverId, {
            type: 'dm',
            message: {
                id: message.id,
                senderId: myId,
                senderName: req.user.displayName,
                content: message.content,
                createdAt: message.createdAt
            }
        });

        logger.info('DM sent', { from: myId, to: receiverId });
        res.status(201).json(message);
    } catch (err) {
        next(err);
    }
});

// ── POST /dm/conversations/:userId/read — Mark messages as read ─────
router.post('/conversations/:userId/read', async (req, res, next) => {
    try {
        const myId = req.user.sub;
        const partnerId = req.params.userId;

        const result = await prisma.directMessage.updateMany({
            where: {
                senderId: partnerId,
                receiverId: myId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ markedRead: result.count });
    } catch (err) {
        next(err);
    }
});

export default router;
