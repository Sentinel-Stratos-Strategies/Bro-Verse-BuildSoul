import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ── GET /users/search?q= — Search users by display name ────────────
router.get('/search', async (req, res, next) => {
    try {
        const q = req.query.q?.trim();
        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const users = await prisma.user.findMany({
            where: {
                displayName: { contains: q, mode: 'insensitive' },
                id: { not: req.user.sub },
                isBanned: false
            },
            select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                tagline: true,
                reputationScore: true
            },
            take: 20
        });

        res.json(users);
    } catch (err) {
        next(err);
    }
});

// ── GET /users/:id/profile — Get public user profile ────────────────
router.get('/:id/profile', async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                tagline: true,
                bio: true,
                reputationScore: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        challengeParticipants: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
});

// ── GET /users/suggestions — Suggested users to connect with ────────
router.get('/suggestions', async (req, res, next) => {
    try {
        const userId = req.user.sub;

        // Get existing relationship user IDs to exclude
        const existingRelationships = await prisma.relationship.findMany({
            where: {
                OR: [
                    { requesterId: userId },
                    { addresseeId: userId }
                ]
            },
            select: { requesterId: true, addresseeId: true }
        });

        const excludeIds = new Set([userId]);
        for (const r of existingRelationships) {
            excludeIds.add(r.requesterId);
            excludeIds.add(r.addresseeId);
        }

        // Get recent active users that aren't already connected
        const suggestions = await prisma.user.findMany({
            where: {
                id: { notIn: [...excludeIds] },
                isBanned: false
            },
            select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                tagline: true,
                reputationScore: true
            },
            orderBy: { lastLoginAt: 'desc' },
            take: 10
        });

        res.json(suggestions);
    } catch (err) {
        next(err);
    }
});

export default router;
