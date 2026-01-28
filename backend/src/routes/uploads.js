// Upload routes for posts
const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { uploadBlob, validateUploadQuota, getStorageUsage } = require('../services/storageService');

const router = express.Router();

// Multer config - store in memory temporarily
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB max
    },
    fileFilter: (req, file, cb) => {
        // Whitelist allowed MIME types
        const allowed = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/quicktime',
            'application/pdf',
            'text/plain',
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    },
});

/**
 * POST /uploads/post
 * Upload file for post attachment
 */
router.post('/post', requireAuth, upload.single('file'), async (req, res) => {
    try {
        const userId = req.user.sub; // JWT subject (user ID)
        const file = req.file;
        const postId = req.body.postId; // Optional: associate with post

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Check quota before uploading
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

        // Get updated usage
        const usage = await getStorageUsage(userId);

        res.status(201).json({
            success: true,
            blob: {
                name: uploadResult.blobName,
                url: uploadResult.url,
                size: uploadResult.size,
                expiresAt: uploadResult.expiresAt,
            },
            storage: {
                used: usage.used,
                quota: usage.quota,
                percentUsed: usage.percentUsed,
            },
            postId: postId || null,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /uploads/persona
 * Upload avatar for AI persona
 */
router.post('/persona', requireAuth, upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.user.sub;
        const file = req.file;
        const personaId = req.body.personaId; // Required: which persona

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        if (!personaId) {
            return res.status(400).json({ error: 'personaId required' });
        }

        // Stricter limit for avatars (10 MB)
        if (file.size > 10 * 1024 * 1024) {
            return res.status(413).json({ error: 'Avatar exceeds 10 MB limit' });
        }

        // Check quota
        const quotaCheck = await validateUploadQuota(userId, file.size);
        if (!quotaCheck.canUpload) {
            return res.status(413).json({ error: quotaCheck.reason });
        }

        // Upload to blob storage
        const uploadResult = await uploadBlob(
            userId,
            file.buffer,
            `persona-${personaId}-${file.originalname}`,
            file.mimetype
        );

        const usage = await getStorageUsage(userId);

        res.status(201).json({
            success: true,
            blob: {
                name: uploadResult.blobName,
                url: uploadResult.url,
                size: uploadResult.size,
                expiresAt: uploadResult.expiresAt,
            },
            storage: {
                used: usage.used,
                quota: usage.quota,
                percentUsed: usage.percentUsed,
            },
            personaId: personaId,
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /uploads/quota
 * Get user's storage quota usage
 */
router.get('/quota', requireAuth, async (req, res) => {
    try {
        const userId = req.user.sub;
        const usage = await getStorageUsage(userId);

        res.json({
            used: usage.used,
            quota: usage.quota,
            percentUsed: usage.percentUsed,
            remaining: usage.quota - usage.used,
        });
    } catch (error) {
        console.error('Quota error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
