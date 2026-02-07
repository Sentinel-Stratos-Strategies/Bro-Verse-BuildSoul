import xss from 'xss';

// Custom XSS whitelist — allow basic formatting but strip scripts/events
const xssOptions = {
    whiteList: {
        b: [],
        i: [],
        em: [],
        strong: [],
        br: [],
        p: [],
        ul: [],
        ol: [],
        li: []
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
};

/**
 * Sanitize a single string value against XSS attacks
 */
export function sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return xss(input, xssOptions);
}

/**
 * Sanitize specific fields on an object (non-destructive — returns new object)
 */
export function sanitizeFields(obj, fields) {
    const sanitized = { ...obj };
    for (const field of fields) {
        if (typeof sanitized[field] === 'string') {
            sanitized[field] = sanitizeString(sanitized[field]);
        }
    }
    return sanitized;
}
