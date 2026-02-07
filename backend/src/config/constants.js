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
    CLAUDE_MODEL: process.env.AI_CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
    OPENAI_MODEL: process.env.AI_OPENAI_MODEL || 'gpt-4o',
    MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS) || 2048,
    RATE_LIMIT: { windowMs: 1 * 60 * 1000, max: 20 }
};

// ── Roster ──────────────────────────────────────────────────────────────
export const ROSTER = {
    LOCK_DAYS: 30,
    MAX_PERSONAS: 4
};
