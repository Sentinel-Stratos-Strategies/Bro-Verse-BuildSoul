import express from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const postSchema = z.object({
    content: z.string().min(1),
    visibility: z.enum(['public', 'friends', 'private']).optional(),
    type: z.enum(['reflection', 'challenge', 'victory', 'wisdom', 'confession']).optional()
});

router.get('/', requireAuth, async (req, res) => {
    const posts = await prisma.post.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            author: { select: { id: true, displayName: true } },
            comments: true,
            reactions: true
        }
    });

    return res.json(posts);
});

router.post('/', requireAuth, async (req, res) => {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    const post = await prisma.post.create({
        data: {
            authorId: req.user.sub,
            content: parsed.data.content,
            visibility: parsed.data.visibility || 'public',
            type: parsed.data.type || 'reflection'
        }
    });

    return res.status(201).json(post);
});

router.post('/:postId/reactions', requireAuth, async (req, res) => {
    const { postId } = req.params;
    const { type = 'like' } = req.body;

    const reaction = await prisma.reaction.upsert({
        where: {
            postId_userId_type: {
                postId,
                userId: req.user.sub,
                type
            }
        },
        update: {},
        create: {
            postId,
            userId: req.user.sub,
            type
        }
    });

    return res.json(reaction);
});

router.post('/:postId/comments', requireAuth, async (req, res) => {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'Content required' });
    }

    const comment = await prisma.comment.create({
        data: {
            postId,
            authorId: req.user.sub,
            content,
            parentId: parentId || null
        }
    });

    return res.status(201).json(comment);
});

export default router;
