import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';
import { getPersonaModelConfig } from '../config/constants.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PERSONAS_DIR = join(__dirname, '../../ai-personas');

/** In-memory cache: slug → { slug, name, systemPrompt, modelConfig } */
const personaCache = new Map();

/**
 * Derive a display name from the filename.
 *   "the-coach.txt"  → "The Coach"
 *   "rocky-top.txt"  → "Rocky Top"
 */
function slugToName(slug) {
    return slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/** Load every .txt file in ai-personas/ into the cache. */
async function loadPersonas() {
    try {
        const files = await readdir(PERSONAS_DIR);
        const txtFiles = files.filter(f => f.endsWith('.txt'));

        await Promise.all(
            txtFiles.map(async (file) => {
                const slug = basename(file, '.txt');
                const systemPrompt = (await readFile(join(PERSONAS_DIR, file), 'utf-8')).trim();
                const modelConfig = getPersonaModelConfig(slug);
                personaCache.set(slug, { slug, name: slugToName(slug), systemPrompt, modelConfig });
            })
        );

        logger.info(`Loaded ${personaCache.size} personas`, {
            personas: [...personaCache.values()].map(p => ({
                slug: p.slug,
                provider: p.modelConfig.provider,
                model: p.modelConfig.model
            }))
        });
    } catch (err) {
        logger.error('Failed to load personas', { error: err.message });
    }
}

// Eagerly load on import
await loadPersonas();

/** Get a single persona by slug. Returns null if not found. */
export function getPersona(slug) {
    return personaCache.get(slug) ?? null;
}

/** Get all personas (without full system prompts — for listing). */
export function getAllPersonas() {
    return [...personaCache.values()].map(({ slug, name, modelConfig }) => ({
        slug,
        name,
        provider: modelConfig.provider,
        model: modelConfig.model
    }));
}

/** Check if a slug exists. */
export function personaExists(slug) {
    return personaCache.has(slug);
}

/** Reload personas from disk (for hot-reload if needed). */
export async function reloadPersonas() {
    personaCache.clear();
    await loadPersonas();
}
