import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();
router.use(requireAuth);

// ── GET /brocalls/upcoming — Get upcoming scheduled Bro Calls ───────
router.get('/upcoming', async (req, res, next) => {
    try {
        const calls = await prisma.broCall.findMany({
            where: {
                userId: req.user.sub,
                status: 'scheduled',
                scheduledAt: { gt: new Date() }
            },
            orderBy: { scheduledAt: 'asc' },
            take: 10
        });

        res.json(calls);
    } catch (err) {
        next(err);
    }
});

// ── GET /brocalls/active — Get currently deliverable Bro Calls ──────
router.get('/active', async (req, res, next) => {
    try {
        const now = new Date();
        const windowMs = 10 * 60 * 1000; // 10-minute delivery window
        const windowStart = new Date(now.getTime() - windowMs);

        const calls = await prisma.broCall.findMany({
            where: {
                userId: req.user.sub,
                status: 'scheduled',
                scheduledAt: {
                    gte: windowStart,
                    lte: now
                }
            },
            orderBy: { scheduledAt: 'asc' }
        });

        res.json(calls);
    } catch (err) {
        next(err);
    }
});

// ── GET /brocalls/history — Past Bro Calls ──────────────────────────
router.get('/history', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        const calls = await prisma.broCall.findMany({
            where: {
                userId: req.user.sub,
                status: { in: ['delivered', 'missed'] }
            },
            orderBy: { scheduledAt: 'desc' },
            take: limit
        });

        res.json(calls);
    } catch (err) {
        next(err);
    }
});

// ── POST /brocalls/:id/seen — Mark Bro Call as delivered/seen ───────
router.post('/:id/seen', async (req, res, next) => {
    try {
        const call = await prisma.broCall.findFirst({
            where: { id: req.params.id, userId: req.user.sub }
        });

        if (!call) {
            return res.status(404).json({ error: 'Bro Call not found' });
        }

        if (call.status !== 'scheduled') {
            return res.json(call);
        }

        const updated = await prisma.broCall.update({
            where: { id: call.id },
            data: {
                status: 'delivered',
                deliveredAt: new Date()
            }
        });

        logger.info('Bro Call delivered', { callId: call.id, userId: req.user.sub });
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// ── POST /brocalls/:id/miss — Mark as missed ───────────────────────
router.post('/:id/miss', async (req, res, next) => {
    try {
        const call = await prisma.broCall.findFirst({
            where: { id: req.params.id, userId: req.user.sub }
        });

        if (!call) {
            return res.status(404).json({ error: 'Bro Call not found' });
        }

        const updated = await prisma.broCall.update({
            where: { id: call.id },
            data: { status: 'missed' }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
});

export default router;
