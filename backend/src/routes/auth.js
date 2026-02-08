import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { AUTH, RATE_LIMITS } from '../config/constants.js';
import { generateToken, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();

// ── Auth-specific rate limiter (tighter than global) ─────────────────
const authLimiter = rateLimit({
    windowMs: RATE_LIMITS.AUTH.windowMs,
    max: RATE_LIMITS.AUTH.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' }
});

router.use(authLimiter);

// ── Zod Schemas ──────────────────────────────────────────────────────
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(2),
    tagline: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});

// ── Token Helpers ────────────────────────────────────────────────────

function signAccessToken(user) {
    return jwt.sign(
        { sub: user.id, role: user.role, displayName: user.displayName },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: AUTH.ACCESS_TOKEN_TTL }
    );
}

/**
 * Create a refresh token, persist it to the database, and return the signed JWT.
 * Each token belongs to a "family" so we can detect reuse and revoke the whole chain.
 */
async function createRefreshToken(user, family) {
    const tokenFamily = family || crypto.randomUUID();
    const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const refreshJwt = jwt.sign(
        { sub: user.id, tokenType: 'refresh', family: tokenFamily },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: AUTH.REFRESH_TOKEN_TTL }
    );

    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshJwt,
            family: tokenFamily,
            expiresAt
        }
    });

    return refreshJwt;
}

/**
 * Sign both access + refresh tokens for a user (register / login flows).
 */
async function signTokenPair(user) {
    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user);
    return { accessToken, refreshToken };
}

// ── POST /auth/register ──────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const { email, password, displayName, tagline } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, AUTH.BCRYPT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                displayName,
                tagline
            }
        });

        logger.info('User registered', { userId: user.id, email: user.email });

        return res.status(201).json({
            user: { id: user.id, email: user.email, displayName: user.displayName, tagline: user.tagline },
            ...(await signTokenPair(user))
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /auth/login ─────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            logger.warn('Failed login attempt', { email, ip: req.ip });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        logger.info('User logged in', { userId: user.id });

        return res.json({
            user: { id: user.id, email: user.email, displayName: user.displayName, tagline: user.tagline },
            ...(await signTokenPair(user))
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /auth/refresh  (Refresh Token Rotation) ────────────────────
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        // 1) Verify JWT signature
        let payload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        if (payload.tokenType !== 'refresh') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        // 2) Look up stored token
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken }
        });

        if (!storedToken) {
            // Token not in DB — possible reuse attack. Revoke entire family.
            if (payload.family) {
                await prisma.refreshToken.updateMany({
                    where: { family: payload.family },
                    data: { isRevoked: true }
                });
                logger.warn('Refresh token reuse detected — family revoked', {
                    userId: payload.sub,
                    family: payload.family
                });
            }
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        if (storedToken.isRevoked) {
            // Revoked token presented — revoke whole family as precaution
            await prisma.refreshToken.updateMany({
                where: { family: storedToken.family },
                data: { isRevoked: true }
            });
            logger.warn('Revoked refresh token presented — family revoked', {
                userId: storedToken.userId,
                family: storedToken.family
            });
            return res.status(401).json({ error: 'Token has been revoked' });
        }

        // 3) Revoke the old token (single-use rotation)
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { isRevoked: true }
        });

        // 4) Issue new pair in the same family
        const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const newAccessToken = signAccessToken(user);
        const newRefreshToken = await createRefreshToken(user, storedToken.family);

        logger.info('Token refreshed', { userId: user.id });

        return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        next(err);
    }
});

// ── POST /auth/logout ────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Revoke specific token + its family
            const storedToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken }
            });
            if (storedToken) {
                await prisma.refreshToken.updateMany({
                    where: { family: storedToken.family },
                    data: { isRevoked: true }
                });
            }
        } else {
            // No token provided — revoke ALL refresh tokens for this user
            await prisma.refreshToken.updateMany({
                where: { userId: req.user.sub },
                data: { isRevoked: true }
            });
        }

        logger.info('User logged out', { userId: req.user.sub });

        return res.json({ message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
});

// ── GET /auth/me — Get current user profile ─────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: {
                id: true,
                email: true,
                displayName: true,
                tagline: true,
                avatarUrl: true,
                bio: true,
                role: true,
                isVerified: true,
                reputationScore: true,
                lastLoginAt: true,
                createdAt: true
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

// ── POST /auth/verify-email — Verify email with token ───────────────
router.post('/verify-email', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const verification = await prisma.emailVerification.findUnique({
            where: { token }
        });

        if (!verification) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        if (verification.usedAt) {
            return res.status(400).json({ error: 'Token already used' });
        }

        if (verification.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Token has expired' });
        }

        // Mark token as used and verify the user
        await prisma.$transaction([
            prisma.emailVerification.update({
                where: { id: verification.id },
                data: { usedAt: new Date() }
            }),
            prisma.user.update({
                where: { id: verification.userId },
                data: { isVerified: true }
            })
        ]);

        logger.info('Email verified', { userId: verification.userId });
        res.json({ message: 'Email verified successfully' });
    } catch (err) {
        next(err);
    }
});

// ── POST /auth/forgot-password — Send password reset email ──────────
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const token = generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        await sendPasswordResetEmail(email, token);

        logger.info('Password reset requested', { userId: user.id });
        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        next(err);
    }
});

// ── POST /auth/reset-password — Reset password with token ───────────
router.post('/reset-password', async (req, res, next) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const resetRecord = await prisma.passwordReset.findUnique({
            where: { token }
        });

        if (!resetRecord) {
            return res.status(400).json({ error: 'Invalid reset token' });
        }

        if (resetRecord.usedAt) {
            return res.status(400).json({ error: 'Token already used' });
        }

        if (resetRecord.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Token has expired' });
        }

        const passwordHash = await bcrypt.hash(password, AUTH.BCRYPT_ROUNDS);

        await prisma.$transaction([
            prisma.passwordReset.update({
                where: { id: resetRecord.id },
                data: { usedAt: new Date() }
            }),
            prisma.user.update({
                where: { id: resetRecord.userId },
                data: { passwordHash }
            }),
            // Revoke all refresh tokens for security
            prisma.refreshToken.updateMany({
                where: { userId: resetRecord.userId },
                data: { isRevoked: true }
            })
        ]);

        logger.info('Password reset completed', { userId: resetRecord.userId });
        res.json({ message: 'Password reset successfully. Please log in with your new password.' });
    } catch (err) {
        next(err);
    }
});

// ── POST /auth/resend-verification — Resend verification email ──────
router.post('/resend-verification', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.sub } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.json({ message: 'Email is already verified' });
        }

        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.emailVerification.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        await sendVerificationEmail(user.email, token);

        logger.info('Verification email resent', { userId: user.id });
        res.json({ message: 'Verification email sent' });
    } catch (err) {
        next(err);
    }
});

export default router;
