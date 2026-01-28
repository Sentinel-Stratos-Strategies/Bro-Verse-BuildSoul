// Cosmos DB Service - AI Profiles persistence
const { CosmosClient } = require('@azure/cosmos');

// Initialize Cosmos client from environment
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = 'broverse';
const containerId = 'ai-profiles';

let client, database, container;

if (endpoint && key) {
    client = new CosmosClient({ endpoint, key });
    database = client.database(databaseId);
    container = database.container(containerId);
} else {
    console.warn('COSMOS_ENDPOINT or COSMOS_KEY not configured. AI profiles operations will fail.');
}

// Persona limits
const MAX_PERSONAS_PER_USER = 20;
const MAX_CONVERSATION_HISTORY = 100; // Keep last 100 messages per persona

/**
 * Get or create AI profile for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} - AI profile document
 */
async function getOrCreateProfile(userId) {
    if (!container) {
        throw new Error('Cosmos DB not configured');
    }

    try {
        const { resource } = await container.item(userId, userId).read();
        return resource;
    } catch (error) {
        if (error.code === 404) {
            // Create new profile
            const newProfile = {
                id: userId,
                userId: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                storageQuota: 5 * 1024 * 1024 * 1024, // 5 GB
                storageUsed: 0,
                personas: [],
            };

            const { resource: created } = await container.items.create(newProfile);
            return created;
        }
        throw error;
    }
}

/**
 * Add persona to user profile
 * @param {string} userId - User ID
 * @param {object} personaData - Persona details (name, systemPrompt, model)
 * @returns {Promise<object>} - Updated profile
 */
async function addPersona(userId, personaData) {
    if (!container) {
        throw new Error('Cosmos DB not configured');
    }

    const profile = await getOrCreateProfile(userId);

    if (profile.personas.length >= MAX_PERSONAS_PER_USER) {
        throw new Error(`Maximum ${MAX_PERSONAS_PER_USER} personas allowed per user`);
    }

    // Check for duplicate names
    if (profile.personas.some(p => p.name === personaData.name)) {
        throw new Error(`Persona "${personaData.name}" already exists`);
    }

    const newPersona = {
        id: `persona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: personaData.name,
        systemPrompt: personaData.systemPrompt,
        model: personaData.model || 'gpt-4',
        status: 'active',
        conversationHistory: [],
        metadata: {
            createdAt: new Date().toISOString(),
            lastInteraction: null,
            messageCount: 0,
            interactions: 0,
        },
    };

    profile.personas.push(newPersona);
    profile.updatedAt = new Date().toISOString();

    const { resource: updated } = await container.item(userId, userId).replace(profile);
    return updated;
}

/**
 * Update persona (conversation history, metadata)
 * @param {string} userId - User ID
 * @param {string} personaId - Persona ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - Updated profile
 */
async function updatePersona(userId, personaId, updates) {
    if (!container) {
        throw new Error('Cosmos DB not configured');
    }

    const profile = await getOrCreateProfile(userId);
    const personaIndex = profile.personas.findIndex(p => p.id === personaId);

    if (personaIndex === -1) {
        throw new Error('Persona not found');
    }

    const persona = profile.personas[personaIndex];

    // Update fields
    if (updates.conversationHistory) {
        persona.conversationHistory = updates.conversationHistory;
        // Trim to last 100 messages
        if (persona.conversationHistory.length > MAX_CONVERSATION_HISTORY) {
            persona.conversationHistory = persona.conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
        }
    }

    if (updates.metadata) {
        persona.metadata = { ...persona.metadata, ...updates.metadata };
    }

    if (updates.status) {
        persona.status = updates.status;
    }

    profile.personas[personaIndex] = persona;
    profile.updatedAt = new Date().toISOString();

    const { resource: updated } = await container.item(userId, userId).replace(profile);
    return updated;
}

/**
 * Add message to persona conversation history
 * @param {string} userId - User ID
 * @param {string} personaId - Persona ID
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 * @returns {Promise<object>} - Updated profile
 */
async function addMessage(userId, personaId, role, content) {
    if (!container) {
        throw new Error('Cosmos DB not configured');
    }

    const profile = await getOrCreateProfile(userId);
    const personaIndex = profile.personas.findIndex(p => p.id === personaId);

    if (personaIndex === -1) {
        throw new Error('Persona not found');
    }

    const persona = profile.personas[personaIndex];

    const message = {
        role: role,
        content: content,
        timestamp: new Date().toISOString(),
    };

    persona.conversationHistory.push(message);

    // Trim to last 100 messages
    if (persona.conversationHistory.length > MAX_CONVERSATION_HISTORY) {
        persona.conversationHistory = persona.conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
    }

    // Update metadata
    persona.metadata.lastInteraction = new Date().toISOString();
    persona.metadata.messageCount = persona.conversationHistory.length;
    persona.metadata.interactions += 1;

    profile.personas[personaIndex] = persona;
    profile.updatedAt = new Date().toISOString();

    const { resource: updated } = await container.item(userId, userId).replace(profile);
    return updated;
}

/**
 * Delete persona
 * @param {string} userId - User ID
 * @param {string} personaId - Persona ID
 * @returns {Promise<object>} - Updated profile
 */
async function deletePersona(userId, personaId) {
    if (!container) {
        throw new Error('Cosmos DB not configured');
    }

    const profile = await getOrCreateProfile(userId);
    const personaIndex = profile.personas.findIndex(p => p.id === personaId);

    if (personaIndex === -1) {
        throw new Error('Persona not found');
    }

    profile.personas.splice(personaIndex, 1);
    profile.updatedAt = new Date().toISOString();

    const { resource: updated } = await container.item(userId, userId).replace(profile);
    return updated;
}

/**
 * Update storage usage
 * @param {string} userId - User ID
 * @param {number} bytesUsed - Current storage usage
 * @returns {Promise<object>} - Updated profile
 */
async function updateStorageUsage(userId, bytesUsed) {
    if (!container) {
        throw new Error('Cosmos DB not configured');
    }

    const profile = await getOrCreateProfile(userId);
    profile.storageUsed = bytesUsed;
    profile.updatedAt = new Date().toISOString();

    const { resource: updated } = await container.item(userId, userId).replace(profile);
    return updated;
}

module.exports = {
    getOrCreateProfile,
    addPersona,
    updatePersona,
    addMessage,
    deletePersona,
    updateStorageUsage,
    MAX_PERSONAS_PER_USER,
};
