import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import logger from '../utils/logger.js';
import { AI } from '../config/constants.js';

// ── Clients (lazy-initialized) ────────────────────────────────────────
let anthropic = null;
let openai = null;

function getAnthropic() {
    if (!anthropic) {
        anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return anthropic;
}

function getOpenAI() {
    if (!openai) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
}

/**
 * Build the messages array for the API call.
 */
function buildMessages(history) {
    return history.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
    }));
}

/**
 * Get the fallback model config for the opposite provider.
 * If primary is anthropic, fallback is openai and vice versa.
 */
function getFallbackConfig(primaryConfig) {
    if (primaryConfig.provider === 'anthropic') {
        return { provider: 'openai', model: AI.OPENAI_MODEL, maxTokens: primaryConfig.maxTokens };
    }
    return { provider: 'anthropic', model: AI.CLAUDE_MODEL, maxTokens: primaryConfig.maxTokens };
}

/**
 * Check if a provider has an API key configured.
 */
function providerAvailable(provider) {
    if (provider === 'anthropic') return !!process.env.ANTHROPIC_API_KEY;
    if (provider === 'openai') return !!process.env.OPENAI_API_KEY;
    return false;
}

// ── Provider-Specific Chat Functions ────────────────────────────────────

async function chatAnthropic(systemPrompt, messages, modelConfig) {
    const params = {
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || AI.MAX_TOKENS,
        system: systemPrompt,
        messages
    };
    if (modelConfig.temperature !== undefined) {
        params.temperature = modelConfig.temperature;
    }

    const response = await getAnthropic().messages.create(params);

    const text = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

    return {
        content: text,
        model: modelConfig.model,
        provider: 'anthropic',
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0
    };
}

async function chatOpenAI(systemPrompt, messages, modelConfig) {
    const params = {
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || AI.MAX_TOKENS,
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
    };
    if (modelConfig.temperature !== undefined) {
        params.temperature = modelConfig.temperature;
    }

    const response = await getOpenAI().chat.completions.create(params);

    const text = response.choices[0]?.message?.content ?? '';
    return {
        content: text,
        model: modelConfig.model,
        provider: 'openai',
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0
    };
}

// ── Provider-Specific Streaming Functions ───────────────────────────────

async function streamAnthropic(systemPrompt, messages, modelConfig, res) {
    const params = {
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || AI.MAX_TOKENS,
        system: systemPrompt,
        messages
    };
    if (modelConfig.temperature !== undefined) {
        params.temperature = modelConfig.temperature;
    }

    let fullContent = '';
    const stream = getAnthropic().messages.stream(params);

    stream.on('text', (text) => {
        fullContent += text;
        res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    const finalMessage = await stream.finalMessage();

    const result = {
        content: fullContent,
        model: modelConfig.model,
        provider: 'anthropic',
        inputTokens: finalMessage.usage?.input_tokens ?? 0,
        outputTokens: finalMessage.usage?.output_tokens ?? 0
    };

    res.write(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`);
    res.end();
    return result;
}

async function streamOpenAI(systemPrompt, messages, modelConfig, res) {
    const params = {
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens || AI.MAX_TOKENS,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true
    };
    if (modelConfig.temperature !== undefined) {
        params.temperature = modelConfig.temperature;
    }

    let fullContent = '';
    const stream = await getOpenAI().chat.completions.create(params);

    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) {
            fullContent += text;
            res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
        }
    }

    const result = {
        content: fullContent,
        model: modelConfig.model,
        provider: 'openai',
        inputTokens: 0,
        outputTokens: 0
    };

    res.write(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`);
    res.end();
    return result;
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Non-streaming chat with per-persona model routing.
 *
 * @param {string} systemPrompt - The persona's system prompt
 * @param {Array} history - Conversation history
 * @param {Object} [modelConfig] - Per-persona model config from personaService
 *   { provider: 'anthropic'|'openai', model: string, maxTokens: number, temperature?: number }
 *   If omitted, uses global defaults (Claude primary, OpenAI fallback).
 */
export async function chat(systemPrompt, history, modelConfig) {
    const messages = buildMessages(history);

    // Use provided model config or default to anthropic/claude
    const primary = modelConfig || {
        provider: 'anthropic',
        model: AI.CLAUDE_MODEL,
        maxTokens: AI.MAX_TOKENS
    };

    const fallback = getFallbackConfig(primary);

    // ── Try primary provider ──
    if (providerAvailable(primary.provider)) {
        try {
            const chatFn = primary.provider === 'anthropic' ? chatAnthropic : chatOpenAI;
            const result = await chatFn(systemPrompt, messages, primary);
            logger.info('AI chat completed', {
                provider: primary.provider,
                model: primary.model,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens
            });
            return result;
        } catch (err) {
            logger.warn(`Primary provider ${primary.provider} failed, trying fallback`, {
                error: err.message,
                primaryModel: primary.model
            });
        }
    }

    // ── Try fallback provider ──
    if (providerAvailable(fallback.provider)) {
        try {
            const chatFn = fallback.provider === 'anthropic' ? chatAnthropic : chatOpenAI;
            const result = await chatFn(systemPrompt, messages, fallback);
            logger.info('AI chat completed (fallback)', {
                provider: fallback.provider,
                model: fallback.model,
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens
            });
            return result;
        } catch (err) {
            logger.error('Fallback provider also failed', {
                error: err.message,
                fallbackModel: fallback.model
            });
            throw err;
        }
    }

    throw new Error('No AI API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
}

/**
 * Streaming chat with per-persona model routing.
 *
 * @param {string} systemPrompt - The persona's system prompt
 * @param {Array} history - Conversation history
 * @param {Object} res - Express Response for SSE
 * @param {Object} [modelConfig] - Per-persona model config from personaService
 */
export async function streamChat(systemPrompt, history, res, modelConfig) {
    const messages = buildMessages(history);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const primary = modelConfig || {
        provider: 'anthropic',
        model: AI.CLAUDE_MODEL,
        maxTokens: AI.MAX_TOKENS
    };

    const fallback = getFallbackConfig(primary);

    // ── Try primary provider ──
    if (providerAvailable(primary.provider)) {
        try {
            const streamFn = primary.provider === 'anthropic' ? streamAnthropic : streamOpenAI;
            const result = await streamFn(systemPrompt, messages, primary, res);
            logger.info('AI stream completed', {
                provider: primary.provider,
                model: primary.model,
                contentLength: result.content.length
            });
            return result;
        } catch (err) {
            logger.warn(`Primary streaming ${primary.provider} failed, trying fallback`, {
                error: err.message,
                primaryModel: primary.model
            });
        }
    }

    // ── Try fallback provider ──
    if (providerAvailable(fallback.provider)) {
        try {
            const streamFn = fallback.provider === 'anthropic' ? streamAnthropic : streamOpenAI;
            const result = await streamFn(systemPrompt, messages, fallback, res);
            logger.info('AI stream completed (fallback)', {
                provider: fallback.provider,
                model: fallback.model
            });
            return result;
        } catch (err) {
            logger.error('Fallback streaming also failed', { error: err.message });
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
                res.end();
            }
            throw err;
        }
    }

    res.write(`data: ${JSON.stringify({ type: 'error', error: 'No AI API key configured' })}\n\n`);
    res.end();
    throw new Error('No AI API key configured.');
}
