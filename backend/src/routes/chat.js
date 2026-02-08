import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { chat, streamChat } from '../services/aiService.js';
import { getPersona, getAllPersonas, personaExists } from '../services/personaService.js';
import { sanitizeString } from '../utils/sanitize.js';
import logger from '../utils/logger.js';
import { PAGINATION } from '../config/constants.js';

const router = Router();

// ── All chat routes require auth ────────────────────────────────────────
router.use(requireAuth);

// ── POST /chat/threads — Create a new thread ────────────────────────────
router.post('/threads', async (req, res, next) => {
    try {
        const { personaSlug, title } = req.body;

        if (!personaSlug || !personaExists(personaSlug)) {
            return res.status(400).json({ error: 'Invalid or missing personaSlug' });
        }

        const thread = await prisma.aiThread.create({
            data: {
                userId: req.user.sub,
                personaSlug,
                title: title ? sanitizeString(title) : null
            }
        });

        logger.info('Thread created', { threadId: thread.id, userId: req.user.sub, personaSlug });
        res.status(201).json(thread);
    } catch (err) {
        next(err);
    }
});

// ── GET /chat/threads — List user's threads ─────────────────────────────
router.get('/threads', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_FEED_LIMIT, 100);
        const cursor = req.query.cursor;

        const where = { userId: req.user.sub, status: 'active' };
        const threads = await prisma.aiThread.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { content: true, role: true, createdAt: true }
                }
            }
        });

        const hasMore = threads.length > limit;
        if (hasMore) threads.pop();

        res.json({
            threads,
            nextCursor: hasMore ? threads[threads.length - 1].id : null
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /chat/threads/:threadId — Get thread with messages ──────────────
router.get('/threads/:threadId', async (req, res, next) => {
    try {
        const thread = await prisma.aiThread.findFirst({
            where: { id: req.params.threadId, userId: req.user.sub },
            include: {
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        res.json(thread);
    } catch (err) {
        next(err);
    }
});

// ── POST /chat/threads/:threadId/messages — Send message (non-streaming) ─
router.post('/threads/:threadId/messages', async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const thread = await prisma.aiThread.findFirst({
            where: { id: req.params.threadId, userId: req.user.sub, status: 'active' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        const persona = getPersona(thread.personaSlug);
        if (!persona) {
            return res.status(500).json({ error: 'Persona not found' });
        }

        // Save user message
        const userMsg = await prisma.aiMessage.create({
            data: {
                threadId: thread.id,
                role: 'user',
                content: sanitizeString(content.trim())
            }
        });

        // Build history from existing messages + new user message
        const history = [...thread.messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
        }));

        // Call AI (routed to persona-specific model)
        const aiResponse = await chat(persona.systemPrompt, history, persona.modelConfig);

        // Save assistant message
        const assistantMsg = await prisma.aiMessage.create({
            data: {
                threadId: thread.id,
                role: 'assistant',
                content: aiResponse.content,
                tokenCount: (aiResponse.inputTokens || 0) + (aiResponse.outputTokens || 0),
                model: aiResponse.model
            }
        });

        // Update thread timestamp
        await prisma.aiThread.update({
            where: { id: thread.id },
            data: { updatedAt: new Date() }
        });

        logger.info('Chat message exchanged', {
            threadId: thread.id,
            userId: req.user.sub,
            persona: thread.personaSlug,
            model: aiResponse.model
        });

        res.json({ userMessage: userMsg, assistantMessage: assistantMsg });
    } catch (err) {
        next(err);
    }
});

// ── POST /chat/threads/:threadId/messages/stream — SSE streaming ────────
router.post('/threads/:threadId/messages/stream', async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const thread = await prisma.aiThread.findFirst({
            where: { id: req.params.threadId, userId: req.user.sub, status: 'active' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        const persona = getPersona(thread.personaSlug);
        if (!persona) {
            return res.status(500).json({ error: 'Persona not found' });
        }

        // Save user message first
        const userMsg = await prisma.aiMessage.create({
            data: {
                threadId: thread.id,
                role: 'user',
                content: sanitizeString(content.trim())
            }
        });

        const history = [...thread.messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
        }));

        // Stream AI response via SSE (routed to persona-specific model)
        const aiResponse = await streamChat(persona.systemPrompt, history, res, persona.modelConfig);

        // Save assistant message after stream completes
        await prisma.aiMessage.create({
            data: {
                threadId: thread.id,
                role: 'assistant',
                content: aiResponse.content,
                tokenCount: (aiResponse.inputTokens || 0) + (aiResponse.outputTokens || 0),
                model: aiResponse.model
            }
        });

        await prisma.aiThread.update({
            where: { id: thread.id },
            data: { updatedAt: new Date() }
        });

        logger.info('Streamed chat response', {
            threadId: thread.id,
            userId: req.user.sub,
            persona: thread.personaSlug,
            model: aiResponse.model
        });
    } catch (err) {
        // If headers already sent (SSE started), we can't send JSON error
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
            res.end();
            logger.error('Stream error', { error: err.message, threadId: req.params.threadId });
        } else {
            next(err);
        }
    }
});

// ── DELETE /chat/threads/:threadId — Archive thread ─────────────────────
router.delete('/threads/:threadId', async (req, res, next) => {
    try {
        const thread = await prisma.aiThread.findFirst({
            where: { id: req.params.threadId, userId: req.user.sub }
        });

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        await prisma.aiThread.update({
            where: { id: thread.id },
            data: { status: 'archived' }
        });

        logger.info('Thread archived', { threadId: thread.id, userId: req.user.sub });
        res.json({ message: 'Thread archived' });
    } catch (err) {
        next(err);
    }
});

// ── GET /chat/personas — List all personas ──────────────────────────────
router.get('/personas', (_req, res) => {
    res.json(getAllPersonas());
});

// ── GET /chat/personas/:slug — Get single persona details ───────────────
router.get('/personas/:slug', (req, res) => {
    const persona = getPersona(req.params.slug);
    if (!persona) {
        return res.status(404).json({ error: 'Persona not found' });
    }
    // Return metadata only (not the full system prompt)
    res.json({
        slug: persona.slug,
        name: persona.name,
        provider: persona.modelConfig?.provider,
        model: persona.modelConfig?.model
    });
});

export default router;
