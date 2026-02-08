import './tracing.js';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';
import { RATE_LIMITS } from './config/constants.js';
import { attachWebSocket } from './services/websocketService.js';
import { startBroCallScheduler } from './jobs/broCallScheduler.js';

// ── Route Imports ───────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import challengeRoutes from './routes/challenges.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/uploads.js';
import aiProfileRoutes from './routes/ai-profiles.js';
import chatRoutes from './routes/chat.js';
import rosterRoutes from './routes/roster.js';
import dmRoutes from './routes/dm.js';
import relationshipRoutes from './routes/relationships.js';
import userRoutes from './routes/users.js';
import broCallRoutes from './routes/brocalls.js';
import badgeRoutes from './routes/badges.js';

dotenv.config();

const app = express();

// ── Security Headers ─────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

// ── Body Parsing ─────────────────────────────────────────────────────
app.use(express.json());

// ── Request Logging (pipe morgan through winston) ────────────────────
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// ── Global Rate Limiter ──────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: RATE_LIMITS.GLOBAL.windowMs,
    max: RATE_LIMITS.GLOBAL.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// ── Health Check (before auth, no rate limit) ────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/challenges', challengeRoutes);
app.use('/notifications', notificationRoutes);
app.use('/uploads', uploadRoutes);
app.use('/ai-profiles', aiProfileRoutes);
app.use('/chat', chatRoutes);
app.use('/roster', rosterRoutes);
app.use('/dm', dmRoutes);
app.use('/relationships', relationshipRoutes);
app.use('/users', userRoutes);
app.use('/brocalls', broCallRoutes);
app.use('/badges', badgeRoutes);

// ── Centralized Error Handler ────────────────────────────────────────
app.use((err, req, res, _next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.sub || 'anonymous'
    });

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(statusCode).json({ error: message });
});

// ── Start Server with WebSocket ──────────────────────────────────────
const port = process.env.PORT || 4000;
const httpServer = createServer(app);

// Attach WebSocket server to the HTTP server
attachWebSocket(httpServer);

// Start Bro Call scheduler (cron jobs)
startBroCallScheduler();

httpServer.listen(port, () => {
    logger.info(`BroVerse API listening on ${port} (HTTP + WebSocket)`);
});
