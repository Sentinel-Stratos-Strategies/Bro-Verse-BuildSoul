import express from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendNotification } from '../utils/notificationsHub.js';
import multer from 'multer';
import { uploadBlob, validateUploadQuota, getStorageUsage } from '../services/storageService.js';

const router = express.Router();

// Multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    },
});

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
            comments: {
                include: {
                    author: { select: { id: true, displayName: true } }
                }
            },
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

    const existing = await prisma.reaction.findUnique({
        where: {
            postId_userId_type: {
                postId,
                userId: req.user.sub,
                type
            }
        }
    });

    if (existing) {
        await prisma.reaction.delete({
            where: {
                postId_userId_type: {
                    postId,
                    userId: req.user.sub,
                    type
                }
            }
        });
        return res.status(204).send();
    }

    const reaction = await prisma.reaction.create({
        data: {
            postId,
            userId: req.user.sub,
            type
        }
    });

    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
    });

    if (post && post.authorId !== req.user.sub) {
        const notification = await prisma.notification.create({
            data: {
                recipientId: post.authorId,
                actorId: req.user.sub,
                type: 'reaction',
                entityType: 'post',
                entityId: postId,
                message: 'reacted to your post'
            },
            include: {
                actor: { select: { id: true, displayName: true } }
            }
        });
        sendNotification(post.authorId, { type: 'notification', notification });
    }

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
        },
        include: {
            author: { select: { id: true, displayName: true } }
        }
    });

    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
    });

    if (post && post.authorId !== req.user.sub) {
        const notification = await prisma.notification.create({
            data: {
                recipientId: post.authorId,
                actorId: req.user.sub,
                type: 'comment',
                entityType: 'post',
                entityId: postId,
                message: 'commented on your post'
            },
            include: {
                actor: { select: { id: true, displayName: true } }
            }
        });
        sendNotification(post.authorId, { type: 'notification', notification });
    }

    return res.status(201).json(comment);
});

/**
 * POST /posts/:postId/upload
 * Upload media attachment to post
 */
router.post('/:postId/upload', requireAuth, upload.single('media'), async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.sub;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Verify post exists and user is author
        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ error: 'Can only upload media to own posts' });
        }

        // Check storage quota
        const quotaCheck = await validateUploadQuota(userId, file.size);
        if (!quotaCheck.canUpload) {
            return res.status(413).json({ error: quotaCheck.reason });
        }

        // Upload to blob storage
        const uploadResult = await uploadBlob(
            userId,
            file.buffer,
            file.originalname,
            file.mimetype
        );

        // Update post with media URL
        const updated = await prisma.post.update({
            where: { id: postId },
            data: {
                mediaUrl: uploadResult.url,
                mediaBlobName: uploadResult.blobName,
                mediaType: file.mimetype
            },
            include: {
                author: { select: { id: true, displayName: true } },
                comments: { include: { author: { select: { id: true, displayName: true } } } },
                reactions: true
            }
        });

        const usage = await getStorageUsage(userId);

        res.status(201).json({
            success: true,
            post: updated,
            media: {
                url: uploadResult.url,
                blobName: uploadResult.blobName,
                size: uploadResult.size,
                expiresAt: uploadResult.expiresAt
            },
            storage: {
                used: usage.used,
                quota: usage.quota,
                percentUsed: usage.percentUsed
            }
        });
    } catch (error) {
        console.error('Post upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

