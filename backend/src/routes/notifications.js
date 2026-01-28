import express from 'express';
import { prisma } from '../db.js';
import { requireAuth, verifyAccessToken } from '../middleware/auth.js';
import { addNotificationClient } from '../utils/notificationsHub.js';

const router = express.Router();

router.get('/stream', async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    const notifications = await prisma.notification.findMany({
        where: { recipientId: payload.sub },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
            actor: { select: { id: true, displayName: true } }
        }
    });

    addNotificationClient(payload.sub, res);
    res.write(`data: ${JSON.stringify({ type: 'snapshot', notifications })}\n\n`);

    const keepAlive = setInterval(() => {
        res.write('event: ping\n');
        res.write(`data: ${Date.now()}\n\n`);
    }, 25000);

    req.on('close', () => clearInterval(keepAlive));
});

router.get('/', requireAuth, async (req, res) => {
    const notifications = await prisma.notification.findMany({
        where: { recipientId: req.user.sub },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
            actor: { select: { id: true, displayName: true } }
        }
    });

    return res.json(notifications);
});

router.post('/:notificationId/read', requireAuth, async (req, res) => {
    const { notificationId } = req.params;

    const updated = await prisma.notification.updateMany({
        where: {
            id: notificationId,
            recipientId: req.user.sub
        },
        data: { isRead: true }
    });

    if (updated.count === 0) {
        return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ status: 'ok' });
});

export default router;
