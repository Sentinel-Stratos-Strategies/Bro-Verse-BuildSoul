import express from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const challengeSchema = z.object({
    title: z.string().min(2),
    description: z.string().min(4),
    challengeType: z.enum(['daily', 'weekly', '30_day', 'custom']).optional(),
    endDate: z.string().datetime().optional()
});

router.get('/', requireAuth, async (req, res) => {
    const challenges = await prisma.challenge.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            creator: { select: { id: true, displayName: true } },
            participants: {
                include: { user: { select: { id: true, displayName: true } } }
            }
        }
    });

    return res.json(challenges);
});

router.post('/', requireAuth, async (req, res) => {
    const parsed = challengeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    const challenge = await prisma.challenge.create({
        data: {
            creatorId: req.user.sub,
            title: parsed.data.title,
            description: parsed.data.description,
            challengeType: parsed.data.challengeType || 'custom',
            endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null
        }
    });

    return res.status(201).json(challenge);
});

router.post('/:challengeId/join', requireAuth, async (req, res) => {
    const { challengeId } = req.params;

    const participant = await prisma.challengeParticipant.upsert({
        where: {
            challengeId_userId: {
                challengeId,
                userId: req.user.sub
            }
        },
        update: {},
        create: {
            challengeId,
            userId: req.user.sub
        }
    });

    return res.json(participant);
});

router.post('/:challengeId/checkins', requireAuth, async (req, res) => {
    const { challengeId } = req.params;
    const { notes } = req.body;

    const participant = await prisma.challengeParticipant.findUnique({
        where: {
            challengeId_userId: {
                challengeId,
                userId: req.user.sub
            }
        }
    });

    if (!participant) {
        return res.status(404).json({ error: 'Join the challenge first.' });
    }

    const checkin = await prisma.challengeCheckin.create({
        data: {
            participantId: participant.id,
            notes: notes || null
        }
    });

    await prisma.challengeParticipant.update({
        where: { id: participant.id },
        data: { currentStreak: { increment: 1 }, bestStreak: { increment: 1 } }
    });

    return res.status(201).json(checkin);
});

export default router;
