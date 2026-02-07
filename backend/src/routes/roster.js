import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getAllPersonas, personaExists } from '../services/personaService.js';
import logger from '../utils/logger.js';
import { ROSTER } from '../config/constants.js';

const router = Router();

router.use(requireAuth);

// ── POST /roster — Lock a new roster (4 personas + optional Alpha Bro) ──
router.post('/', async (req, res, next) => {
    try {
        const { personaSlugs, alphaBroConfig } = req.body;

        if (!Array.isArray(personaSlugs) || personaSlugs.length < 1 || personaSlugs.length > ROSTER.MAX_PERSONAS) {
            return res.status(400).json({
                error: `Select between 1 and ${ROSTER.MAX_PERSONAS} personas`
            });
        }

        // Validate all slugs exist
        const invalid = personaSlugs.filter(s => !personaExists(s));
        if (invalid.length > 0) {
            return res.status(400).json({ error: `Unknown personas: ${invalid.join(', ')}` });
        }

        // Check for duplicate slugs
        if (new Set(personaSlugs).size !== personaSlugs.length) {
            return res.status(400).json({ error: 'Duplicate personas not allowed' });
        }

        // Check if user already has an active, non-expired roster
        const activeRoster = await prisma.userRoster.findFirst({
            where: {
                userId: req.user.sub,
                isActive: true,
                expiresAt: { gt: new Date() }
            }
        });

        if (activeRoster) {
            const daysRemaining = Math.ceil((activeRoster.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
            return res.status(409).json({
                error: `Active roster exists. ${daysRemaining} days remaining.`,
                roster: activeRoster
            });
        }

        // Deactivate any stale rosters
        await prisma.userRoster.updateMany({
            where: { userId: req.user.sub, isActive: true },
            data: { isActive: false }
        });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + ROSTER.LOCK_DAYS);

        const roster = await prisma.userRoster.create({
            data: {
                userId: req.user.sub,
                personaSlugs,
                alphaBroConfig: alphaBroConfig ?? null,
                expiresAt,
                isActive: true
            }
        });

        logger.info('Roster locked', {
            userId: req.user.sub,
            personas: personaSlugs,
            expiresAt: expiresAt.toISOString()
        });

        res.status(201).json(roster);
    } catch (err) {
        next(err);
    }
});

// ── GET /roster/active — Get current active roster ──────────────────────
router.get('/active', async (req, res, next) => {
    try {
        const roster = await prisma.userRoster.findFirst({
            where: {
                userId: req.user.sub,
                isActive: true,
                expiresAt: { gt: new Date() }
            }
        });

        if (!roster) {
            return res.json({ roster: null, message: 'No active roster' });
        }

        const daysRemaining = Math.ceil((roster.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
        res.json({ roster, daysRemaining });
    } catch (err) {
        next(err);
    }
});

// ── GET /roster/history — Past rosters ──────────────────────────────────
router.get('/history', async (req, res, next) => {
    try {
        const rosters = await prisma.userRoster.findMany({
            where: { userId: req.user.sub },
            orderBy: { lockedAt: 'desc' },
            take: 20
        });

        res.json(rosters);
    } catch (err) {
        next(err);
    }
});

// ── GET /roster/available — All personas with metadata ──────────────────
router.get('/available', (_req, res) => {
    res.json(getAllPersonas());
});

export default router;
