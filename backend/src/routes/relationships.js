import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendToUser } from '../services/websocketService.js';
import logger from '../utils/logger.js';

const router = Router();
router.use(requireAuth);

// ── POST /relationships/request — Send friend request ───────────────
router.post('/request', async (req, res, next) => {
    try {
        const { addresseeId } = req.body;
        const requesterId = req.user.sub;

        if (!addresseeId) {
            return res.status(400).json({ error: 'addresseeId is required' });
        }

        if (requesterId === addresseeId) {
            return res.status(400).json({ error: 'Cannot send request to yourself' });
        }

        // Check user exists
        const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
        if (!addressee) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check for existing relationship
        const existing = await prisma.relationship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'blocked') {
                return res.status(403).json({ error: 'Cannot send request' });
            }
            return res.status(409).json({ error: 'Relationship already exists', relationship: existing });
        }

        const relationship = await prisma.relationship.create({
            data: { requesterId, addresseeId, status: 'pending' }
        });

        // Real-time notification
        sendToUser(addresseeId, {
            type: 'friend_request',
            from: { id: requesterId, displayName: req.user.displayName },
            relationshipId: relationship.id
        });

        logger.info('Friend request sent', { from: requesterId, to: addresseeId });
        res.status(201).json(relationship);
    } catch (err) {
        next(err);
    }
});

// ── POST /relationships/:id/accept — Accept friend request ──────────
router.post('/:id/accept', async (req, res, next) => {
    try {
        const relationship = await prisma.relationship.findUnique({
            where: { id: req.params.id }
        });

        if (!relationship || relationship.addresseeId !== req.user.sub) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (relationship.status !== 'pending') {
            return res.status(400).json({ error: 'Request is not pending' });
        }

        const updated = await prisma.relationship.update({
            where: { id: relationship.id },
            data: { status: 'accepted' }
        });

        sendToUser(relationship.requesterId, {
            type: 'friend_accepted',
            by: { id: req.user.sub, displayName: req.user.displayName }
        });

        logger.info('Friend request accepted', { relationshipId: relationship.id });
        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// ── POST /relationships/:id/reject — Reject friend request ─────────
router.post('/:id/reject', async (req, res, next) => {
    try {
        const relationship = await prisma.relationship.findUnique({
            where: { id: req.params.id }
        });

        if (!relationship || relationship.addresseeId !== req.user.sub) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const updated = await prisma.relationship.update({
            where: { id: relationship.id },
            data: { status: 'rejected' }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// ── POST /relationships/:id/block — Block a user ───────────────────
router.post('/:id/block', async (req, res, next) => {
    try {
        const relationship = await prisma.relationship.findUnique({
            where: { id: req.params.id }
        });

        if (!relationship) {
            return res.status(404).json({ error: 'Relationship not found' });
        }

        // Only participants can block
        if (relationship.requesterId !== req.user.sub && relationship.addresseeId !== req.user.sub) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updated = await prisma.relationship.update({
            where: { id: relationship.id },
            data: { status: 'blocked' }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
});

// ── GET /relationships/friends — List accepted friends ──────────────
router.get('/friends', async (req, res, next) => {
    try {
        const userId = req.user.sub;

        const relationships = await prisma.relationship.findMany({
            where: {
                status: 'accepted',
                OR: [
                    { requesterId: userId },
                    { addresseeId: userId }
                ]
            },
            include: {
                requester: { select: { id: true, displayName: true, avatarUrl: true, tagline: true } },
                addressee: { select: { id: true, displayName: true, avatarUrl: true, tagline: true } }
            }
        });

        const friends = relationships.map(r => {
            const friend = r.requesterId === userId ? r.addressee : r.requester;
            return { ...friend, relationshipId: r.id };
        });

        res.json(friends);
    } catch (err) {
        next(err);
    }
});

// ── GET /relationships/pending — Pending requests ───────────────────
router.get('/pending', async (req, res, next) => {
    try {
        const userId = req.user.sub;

        const incoming = await prisma.relationship.findMany({
            where: { addresseeId: userId, status: 'pending' },
            include: {
                requester: { select: { id: true, displayName: true, avatarUrl: true } }
            }
        });

        const outgoing = await prisma.relationship.findMany({
            where: { requesterId: userId, status: 'pending' },
            include: {
                addressee: { select: { id: true, displayName: true, avatarUrl: true } }
            }
        });

        res.json({ incoming, outgoing });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /relationships/:id — Remove friend ───────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const relationship = await prisma.relationship.findUnique({
            where: { id: req.params.id }
        });

        if (!relationship) {
            return res.status(404).json({ error: 'Relationship not found' });
        }

        if (relationship.requesterId !== req.user.sub && relationship.addresseeId !== req.user.sub) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.relationship.delete({ where: { id: relationship.id } });

        logger.info('Relationship removed', { relationshipId: relationship.id });
        res.json({ message: 'Relationship removed' });
    } catch (err) {
        next(err);
    }
});

export default router;
