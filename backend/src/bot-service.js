/**
 * BroVerse Bot Service
 * 
 * Containerized Node.js service that:
 * 1. Loads persona system prompt from ai-personas/ directory
 * 2. Handles chat requests via OpenAI API
 * 3. Stores conversation history in Cosmos DB
 * 4. Runs as independent container instance per persona
 */

const express = require('express');
const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables (set by Container Apps)
const PERSONA_NAME = process.env.PERSONA_NAME; // e.g., "dick-diggs"
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

// Validate required env vars
if (!PERSONA_NAME) {
  console.error('ERROR: PERSONA_NAME environment variable is required');
  process.exit(1);
}

if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
  console.error('ERROR: COSMOS_ENDPOINT and COSMOS_KEY are required');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is required');
  process.exit(1);
}

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: COSMOS_ENDPOINT,
  key: COSMOS_KEY
});

const database = cosmosClient.database('broverse');
const container = database.container('ai-profiles');

// Middleware
app.use(express.json());

// CORS (allow requests from API service)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Load system prompt on startup
let systemPrompt = '';

async function loadSystemPrompt() {
  try {
    const promptPath = path.join(__dirname, '..', 'ai-personas', `${PERSONA_NAME}.txt`);
    systemPrompt = await fs.readFile(promptPath, 'utf-8');
    console.log(`✅ Loaded system prompt for persona: ${PERSONA_NAME}`);
    console.log(`📝 Prompt length: ${systemPrompt.length} characters`);
  } catch (error) {
    console.error(`❌ Failed to load system prompt for ${PERSONA_NAME}:`, error.message);
    console.error(`   Tried path: ai-personas/${PERSONA_NAME}.txt`);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    persona: PERSONA_NAME,
    promptLoaded: systemPrompt.length > 0,
    timestamp: new Date().toISOString()
  });
});

// Get persona info
app.get('/info', (req, res) => {
  res.json({
    personaName: PERSONA_NAME,
    model: OPENAI_MODEL,
    promptLength: systemPrompt.length,
    version: '1.0.0'
  });
});

/**
 * Chat endpoint
 * POST /chat
 * Body: { userId: string, message: string, conversationHistory: array }
 * Returns: { response: string, usage: object }
 */
app.post('/chat', async (req, res) => {
  try {
    const { userId, message, conversationHistory = [] } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    console.log(`💬 Chat request from user ${userId}: "${message.substring(0, 50)}..."`);

    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory, // Include recent conversation history
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 500
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('❌ OpenAI API error:', errorData);
      return res.status(openaiResponse.status).json({
        error: 'OpenAI API error',
        details: errorData
      });
    }

    const data = await openaiResponse.json();
    const assistantMessage = data.choices[0].message.content;

    console.log(`✅ Generated response (${assistantMessage.length} chars)`);

    // Store conversation in Cosmos DB
    try {
      await storeConversation(userId, message, assistantMessage);
    } catch (cosmosError) {
      console.error('⚠️  Failed to store conversation in Cosmos:', cosmosError.message);
      // Continue even if storage fails
    }

    res.json({
      response: assistantMessage,
      usage: data.usage,
      model: OPENAI_MODEL,
      persona: PERSONA_NAME
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Store conversation in Cosmos DB
 */
async function storeConversation(userId, userMessage, assistantMessage) {
  try {
    // Get or create user profile
    const { resource: profile } = await container.item(userId, userId).read();

    // Find persona in profile
    const persona = profile.personas.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === PERSONA_NAME);

    if (!persona) {
      console.warn(`⚠️  Persona ${PERSONA_NAME} not found in user ${userId} profile`);
      return;
    }

    // Append messages to conversation history
    persona.conversationHistory.push(
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString()
      }
    );

    // Trim to last 100 messages
    if (persona.conversationHistory.length > 100) {
      persona.conversationHistory = persona.conversationHistory.slice(-100);
    }

    // Update in Cosmos
    await container.item(userId, userId).replace(profile);
    console.log(`💾 Stored conversation for ${userId}/${PERSONA_NAME}`);

  } catch (error) {
    console.error('❌ Cosmos DB storage error:', error.message);
    throw error;
  }
}

// Start server
(async () => {
  await loadSystemPrompt();

  app.listen(PORT, () => {
    console.log('');
    console.log('🤖 ==========================================');
    console.log(`🤖 BroVerse Bot Service`);
    console.log(`🤖 Persona: ${PERSONA_NAME}`);
    console.log(`🤖 Port: ${PORT}`);
    console.log(`🤖 Model: ${OPENAI_MODEL}`);
    console.log(`🤖 Ready to chat!`);
    console.log('🤖 ==========================================');
    console.log('');
  });
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
