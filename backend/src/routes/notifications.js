import express from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

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
