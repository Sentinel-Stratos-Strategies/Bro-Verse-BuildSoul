// ── Authentication Constants ──────────────────────────────────────────
export const AUTH = {
    ACCESS_TOKEN_TTL:  process.env.JWT_ACCESS_TTL  || '15m',
    REFRESH_TOKEN_TTL: process.env.JWT_REFRESH_TTL || '7d',
    BCRYPT_ROUNDS: 10,
    REFRESH_TOKEN_EXPIRY_DAYS: 7
};

// ── Rate Limiting ────────────────────────────────────────────────────
export const RATE_LIMITS = {
    // Global: 100 requests per 15 minutes per IP
    GLOBAL: {
        windowMs: 15 * 60 * 1000,
        max: 100
    },
    // Auth endpoints: tighter — 20 requests per 15 minutes
    AUTH: {
        windowMs: 15 * 60 * 1000,
        max: 20
    },
    // Post creation: 30 per 15 minutes
    POST_CREATION: {
        windowMs: 15 * 60 * 1000,
        max: 30
    }
};

// ── Pagination ───────────────────────────────────────────────────────
export const PAGINATION = {
    DEFAULT_FEED_LIMIT: 50
};

// ── AI Configuration ────────────────────────────────────────────────────
export const AI = {
    // Default models (used when no persona-specific override exists)
    CLAUDE_MODEL: process.env.AI_CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
    OPENAI_MODEL: process.env.AI_OPENAI_MODEL || 'gpt-4o',
    MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS) || 2048,
    RATE_LIMIT: { windowMs: 1 * 60 * 1000, max: 20 }
};

// ── Per-Persona Model Routing ───────────────────────────────────────────
// provider: 'anthropic' | 'openai'
// model: specific model string
// maxTokens: override per persona (optional, falls back to AI.MAX_TOKENS)
// temperature: override per persona (optional, defaults vary by provider)
//
// Override any persona via env: PERSONA_MODEL_<SLUG_UPPER>=provider:model
//   e.g. PERSONA_MODEL_HARBOR=openai:gpt-4o
//   e.g. PERSONA_MODEL_ROCKY_TOP=anthropic:claude-sonnet-4-5-20250929
export const PERSONA_MODELS = {
    // ── Detailed Personas (6) — Claude Sonnet 4.5 (deepest, most nuanced) ──
    'harbor':       { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 2048, temperature: 1.0 },
    'rocky-top':    { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536, temperature: 0.8 },
    'marvin':       { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 2048, temperature: 0.7 },
    'rgan-stone':   { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 2048, temperature: 0.9 },
    'dick-diggs':   { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536, temperature: 0.8 },
    'tim-buckley':  { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 2048, temperature: 1.0 },

    // ── Placeholder Personas (13) — Claude Sonnet 4.5 (same quality, lighter prompts) ──
    'the-coach':       { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-strategist':  { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-healer':      { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-warrior':     { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-artist':      { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-monk':        { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-builder':     { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-mentor':      { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-rebel':       { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-scientist':   { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-storyteller': { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-navigator':   { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 },
    'the-guardian':    { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929', maxTokens: 1536 }
};

/**
 * Get model config for a persona slug.
 * Checks env overrides first (PERSONA_MODEL_HARBOR=openai:gpt-4o),
 * then falls back to PERSONA_MODELS map, then to global defaults.
 */
export function getPersonaModelConfig(slug) {
    // Check env override: PERSONA_MODEL_HARBOR, PERSONA_MODEL_ROCKY_TOP, etc.
    const envKey = `PERSONA_MODEL_${slug.replace(/-/g, '_').toUpperCase()}`;
    const envVal = process.env[envKey];

    if (envVal) {
        const [provider, model] = envVal.split(':');
        if (provider && model) {
            return {
                provider,
                model,
                maxTokens: AI.MAX_TOKENS,
                temperature: undefined
            };
        }
    }

    // Check persona map
    if (PERSONA_MODELS[slug]) {
        return {
            provider: PERSONA_MODELS[slug].provider,
            model: PERSONA_MODELS[slug].model,
            maxTokens: PERSONA_MODELS[slug].maxTokens || AI.MAX_TOKENS,
            temperature: PERSONA_MODELS[slug].temperature
        };
    }

    // Global default: Claude primary
    return {
        provider: 'anthropic',
        model: AI.CLAUDE_MODEL,
        maxTokens: AI.MAX_TOKENS,
        temperature: undefined
    };
}

// ── Roster ──────────────────────────────────────────────────────────────
export const ROSTER = {
    LOCK_DAYS: 30,
    MAX_PERSONAS: 4
};
