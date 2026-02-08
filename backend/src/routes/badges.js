import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /badges — List all badges ───────────────────────────────────
router.get('/', async (_req, res, next) => {
    try {
        const badges = await prisma.badge.findMany({
            orderBy: { category: 'asc' }
        });
        res.json(badges);
    } catch (err) {
        next(err);
    }
});

// ── GET /badges/mine — List my earned badges ────────────────────────
router.get('/mine', requireAuth, async (req, res, next) => {
    try {
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: req.user.sub },
            include: {
                badge: true
            },
            orderBy: { earnedAt: 'desc' }
        });

        res.json(userBadges);
    } catch (err) {
        next(err);
    }
});

export default router;
