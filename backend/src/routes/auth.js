import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';

const router = express.Router();

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

function signTokens(user) {
    const accessToken = jwt.sign(
        { sub: user.id, role: user.role, displayName: user.displayName },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TTL || '15m' }
    );

    const refreshToken = jwt.sign(
        { sub: user.id, tokenType: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_TTL || '7d' }
    );

    return { accessToken, refreshToken };
}

router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    const { email, password, displayName, tagline } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            displayName,
            tagline
        }
    });

    return res.status(201).json({
        user: { id: user.id, email: user.email, displayName: user.displayName, tagline: user.tagline },
        ...signTokens(user)
    });
});

router.post('/login', async (req, res) => {
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
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.json({
        user: { id: user.id, email: user.email, displayName: user.displayName, tagline: user.tagline },
        ...signTokens(user)
    });
});

export default router;
