// AI Profiles routes
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
    getOrCreateProfile,
    addPersona,
    updatePersona,
    addMessage,
    deletePersona,
    updateStorageUsage,
    MAX_PERSONAS_PER_USER,
} = require('../services/cosmosService');
const { getStorageUsage } = require('../services/storageService');

const router = express.Router();

/**
 * GET /ai-profiles/:userId
 * Get user's AI profile (all personas)
 */
router.get('/:userId', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify user can only access own profile
        if (userId !== req.user.sub) {
            return res.status(403).json({ error: 'Cannot access other users\' profiles' });
        }

        const profile = await getOrCreateProfile(userId);

        // Get storage usage
        const storage = await getStorageUsage(userId);

        res.json({
            ...profile,
            storage: {
                used: storage.used,
                quota: storage.quota,
                percentUsed: storage.percentUsed,
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /ai-profiles/:userId/personas
 * Create new persona
 */
router.post('/:userId/personas', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, systemPrompt, model } = req.body;

        if (userId !== req.user.sub) {
            return res.status(403).json({ error: 'Cannot modify other users\' profiles' });
        }

        if (!name || !systemPrompt) {
            return res.status(400).json({ error: 'name and systemPrompt required' });
        }

        const updated = await addPersona(userId, { name, systemPrompt, model });

        res.status(201).json({
            success: true,
            profile: updated,
            persona: updated.personas.find(p => p.name === name),
        });
    } catch (error) {
        console.error('Create persona error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * PUT /ai-profiles/:userId/personas/:personaId
 * Update persona (metadata, status)
 */
router.put('/:userId/personas/:personaId', requireAuth, async (req, res) => {
    try {
        const { userId, personaId } = req.params;
        const updates = req.body;

        if (userId !== req.user.sub) {
            return res.status(403).json({ error: 'Cannot modify other users\' profiles' });
        }

        const updated = await updatePersona(userId, personaId, updates);

        res.json({
            success: true,
            profile: updated,
            persona: updated.personas.find(p => p.id === personaId),
        });
    } catch (error) {
        console.error('Update persona error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * DELETE /ai-profiles/:userId/personas/:personaId
 * Delete persona
 */
router.delete('/:userId/personas/:personaId', requireAuth, async (req, res) => {
    try {
        const { userId, personaId } = req.params;

        if (userId !== req.user.sub) {
            return res.status(403).json({ error: 'Cannot modify other users\' profiles' });
        }

        const updated = await deletePersona(userId, personaId);

        res.status(204).send();
    } catch (error) {
        console.error('Delete persona error:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /ai-profiles/:userId/personas/:personaId/chat
 * Send message to persona (add to conversation history)
 */
router.post('/:userId/personas/:personaId/chat', requireAuth, async (req, res) => {
    try {
        const { userId, personaId } = req.params;
        const { message } = req.body;

        if (userId !== req.user.sub) {
            return res.status(403).json({ error: 'Cannot access other users\' personas' });
        }

        if (!message) {
            return res.status(400).json({ error: 'message required' });
        }

        // Add user message
        await addMessage(userId, personaId, 'user', message);

        // TODO: Call bot service (container) to get AI response
        // For now, return mock response
        const mockResponse = `[${personaId}] I received your message: "${message}". Bot service integration coming in Phase 5!`;

        // Add assistant response
        const updated = await addMessage(userId, personaId, 'assistant', mockResponse);

        const persona = updated.personas.find(p => p.id === personaId);

        res.json({
            success: true,
            persona: {
                id: persona.id,
                name: persona.name,
                conversationHistory: persona.conversationHistory,
                metadata: persona.metadata,
            },
            response: mockResponse,
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /ai-profiles/:userId/quota
 * Get storage quota info
 */
router.get('/:userId/quota', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        if (userId !== req.user.sub) {
            return res.status(403).json({ error: 'Cannot access other users\' quota' });
        }

        const profile = await getOrCreateProfile(userId);
        const storage = await getStorageUsage(userId);

        // Sync storage usage in Cosmos
        if (storage.used !== profile.storageUsed) {
            await updateStorageUsage(userId, storage.used);
        }

        res.json({
            used: storage.used,
            quota: storage.quota,
            percentUsed: storage.percentUsed,
            remaining: storage.quota - storage.used,
            personas: profile.personas.length,
            maxPersonas: MAX_PERSONAS_PER_USER,
        });
    } catch (error) {
        console.error('Quota error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
