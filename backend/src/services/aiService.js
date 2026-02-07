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
 * Combines the system prompt from the persona with conversation history.
 */
function buildMessages(history) {
    return history.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
    }));
}

/**
 * Non-streaming chat — returns a single response string.
 * Tries Claude first, falls back to OpenAI if ANTHROPIC_API_KEY is missing or fails.
 */
export async function chat(systemPrompt, history) {
    const messages = buildMessages(history);

    // ── Try Claude (primary) ──
    if (process.env.ANTHROPIC_API_KEY) {
        try {
            const response = await getAnthropic().messages.create({
                model: AI.CLAUDE_MODEL,
                max_tokens: AI.MAX_TOKENS,
                system: systemPrompt,
                messages
            });

            const text = response.content
                .filter(block => block.type === 'text')
                .map(block => block.text)
                .join('');

            return {
                content: text,
                model: AI.CLAUDE_MODEL,
                inputTokens: response.usage?.input_tokens ?? 0,
                outputTokens: response.usage?.output_tokens ?? 0
            };
        } catch (err) {
            logger.warn('Claude API failed, trying OpenAI fallback', { error: err.message });
        }
    }

    // ── Fallback to OpenAI ──
    if (process.env.OPENAI_API_KEY) {
        const response = await getOpenAI().chat.completions.create({
            model: AI.OPENAI_MODEL,
            max_tokens: AI.MAX_TOKENS,
            messages: [{ role: 'system', content: systemPrompt }, ...messages]
        });

        const text = response.choices[0]?.message?.content ?? '';
        return {
            content: text,
            model: AI.OPENAI_MODEL,
            inputTokens: response.usage?.prompt_tokens ?? 0,
            outputTokens: response.usage?.completion_tokens ?? 0
        };
    }

    throw new Error('No AI API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
}

/**
 * Streaming chat — writes SSE events to an Express Response.
 * Tries Claude first, falls back to OpenAI.
 */
export async function streamChat(systemPrompt, history, res) {
    const messages = buildMessages(history);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullContent = '';
    let model = '';
    let inputTokens = 0;
    let outputTokens = 0;

    // ── Try Claude (primary) ──
    if (process.env.ANTHROPIC_API_KEY) {
        try {
            const stream = getAnthropic().messages.stream({
                model: AI.CLAUDE_MODEL,
                max_tokens: AI.MAX_TOKENS,
                system: systemPrompt,
                messages
            });

            stream.on('text', (text) => {
                fullContent += text;
                res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
            });

            const finalMessage = await stream.finalMessage();
            model = AI.CLAUDE_MODEL;
            inputTokens = finalMessage.usage?.input_tokens ?? 0;
            outputTokens = finalMessage.usage?.output_tokens ?? 0;

            res.write(`data: ${JSON.stringify({ type: 'done', model, inputTokens, outputTokens })}\n\n`);
            res.end();

            return { content: fullContent, model, inputTokens, outputTokens };
        } catch (err) {
            logger.warn('Claude streaming failed, trying OpenAI fallback', { error: err.message });
        }
    }

    // ── Fallback to OpenAI ──
    if (process.env.OPENAI_API_KEY) {
        const stream = await getOpenAI().chat.completions.create({
            model: AI.OPENAI_MODEL,
            max_tokens: AI.MAX_TOKENS,
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            stream: true
        });

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) {
                fullContent += text;
                res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
            }
        }

        model = AI.OPENAI_MODEL;
        res.write(`data: ${JSON.stringify({ type: 'done', model })}\n\n`);
        res.end();

        return { content: fullContent, model, inputTokens: 0, outputTokens: 0 };
    }

    res.write(`data: ${JSON.stringify({ type: 'error', error: 'No AI API key configured' })}\n\n`);
    res.end();
    throw new Error('No AI API key configured.');
}
