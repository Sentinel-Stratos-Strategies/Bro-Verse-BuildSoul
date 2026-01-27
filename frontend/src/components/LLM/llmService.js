/**
 * LLM Integration Module
 * Handles AI-powered character responses
 * 
 * This is the structure for integrating with a local LLM or API
 * For now, it provides placeholder responses based on character data
 */

import { tracer } from '../../telemetry';

/**
 * Generate a response from a character based on context
 * @param {Object} character - The character to respond as
 * @param {string} prompt - The user's input/question
 * @param {Object} options - Additional options for generation
 * @returns {Promise<string>} The character's response
 */
export async function generateCharacterResponse(character, prompt, options = {}) {
  const timer = tracer.startTimer('llm_response_generation');
  
  const {
    maxTokens = 150,
    temperature = 0.7,
    localLLM = null, // For future local LLM integration
    apiEndpoint = null // For future API integration
  } = options;

  console.log(`Generating response for ${character.name}: "${prompt.substring(0, 50)}..."`);

  try {
    let response;
    
    // If local LLM is provided, use it
    if (localLLM) {
      response = await localLLM.generate(buildPrompt(character, prompt), {
        maxTokens,
        temperature
      });
    }
    // If API endpoint is provided, use it
    else if (apiEndpoint) {
      response = await callLLMApi(apiEndpoint, character, prompt, options);
    }
    // Fallback: Generate a response based on character's voice style
    else {
      response = generateFallbackResponse(character, prompt);
    }
    
    const duration = timer.stop({ 
      character: character.name,
      promptLength: prompt.length,
      responseLength: response.length,
      mode: localLLM ? 'local' : apiEndpoint ? 'api' : 'fallback'
    });
    
    tracer.trackEvent('llm_response_generated', {
      character: character.name,
      archetype: character.archetype,
      promptLength: prompt.length,
      responseLength: response.length,
      duration
    });
    
    return response;
  } catch (error) {
    timer.stop({ error: true, character: character.name });
    tracer.trackError(error, { 
      operation: 'generateCharacterResponse',
      character: character.name 
    });
    console.error('Error generating character response:', error);
    return generateFallbackResponse(character, prompt);
  }
}

/**
 * Build a system prompt for the character
 */
export function buildCharacterSystemPrompt(character) {
  return `You are ${character.name}, known as "${character.archetype}".

TAGLINE: "${character.tagline}"

PHILOSOPHY: ${character.philosophy}

CORE TRAITS: ${character.coreTraits?.join(', ')}

VOICE STYLE:
- Tone: ${character.voiceStyle?.tone}
- Vocabulary: ${character.voiceStyle?.vocabulary}
- Signature: ${character.voiceStyle?.signature}
- Delivery: ${character.voiceStyle?.delivery}

WHEN TO CALL YOU:
${character.whenToCall?.map(w => `- ${w}`).join('\n')}

Stay in character. Respond as ${character.name} would. Be authentic to this archetype.
Do not break character. Do not mention you are an AI.`;
}

/**
 * Build the full prompt for the LLM
 */
function buildPrompt(character, userMessage) {
  return {
    system: buildCharacterSystemPrompt(character),
    user: userMessage
  };
}

/**
 * Call external LLM API
 */
async function callLLMApi(endpoint, character, prompt, options) {
  const startTime = performance.now();
  
  try {
    console.log(`Calling LLM API: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        character: buildCharacterSystemPrompt(character),
        message: prompt,
        maxTokens: options.maxTokens,
        temperature: options.temperature
      })
    });

    const duration = performance.now() - startTime;

    if (!response.ok) {
      throw new Error(`LLM API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    tracer.trackApiCall(endpoint, 'POST', response.status, duration, {
      character: character.name,
      success: true
    });
    
    return data.response || data.message || data.content;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('LLM API error:', error);
    
    tracer.trackApiCall(endpoint, 'POST', 'error', duration, {
      character: character.name,
      success: false,
      error: error.message
    });
    
    return generateFallbackResponse(character, prompt);
  }
}

/**
 * Generate a fallback response when LLM is not available
 * Uses character data to craft an appropriate response
 */
function generateFallbackResponse(character) {
  const responses = getCharacterResponses(character);
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

/**
 * Pre-defined responses for each character when LLM is unavailable
 */
function getCharacterResponses(character) {
  const defaultResponses = [
    `${character.philosophy}`,
    character.tagline,
    `That's the kind of question I respect. ${character.philosophy}`,
    `Brother, let me tell you something: ${character.tagline.toLowerCase()}`,
    `You already know the answer. ${character.coreTraits?.[0]} is what matters here.`
  ];

  // Add character-specific flavor
  if (character.voiceStyle?.signature) {
    defaultResponses.push(`Remember this: ${character.voiceStyle.signature}.`);
  }

  return defaultResponses;
}

/**
 * Configuration for local LLM integration
 * To be expanded when integrating with actual local models
 */
export const LLMConfig = {
  // Supported local LLM backends
  backends: {
    OLLAMA: 'ollama',
    LLAMA_CPP: 'llama.cpp',
    TRANSFORMERS: 'transformers',
    CUSTOM: 'custom'
  },

  // Default model settings
  defaultSettings: {
    maxTokens: 150,
    temperature: 0.7,
    topP: 0.9,
    repeatPenalty: 1.1
  },

  // Character-specific overrides
  characterSettings: {
    'Sergeant Steele': { temperature: 0.5, maxTokens: 100 }, // More direct
    'Free Guy Therapist': { temperature: 0.8, maxTokens: 200 }, // More exploratory
    'Preach': { temperature: 0.6, maxTokens: 180 } // Balance of fire and grace
  }
};

export default {
  generateCharacterResponse,
  buildCharacterSystemPrompt,
  LLMConfig
};
