import { cleanText as purifyCleanText } from './purify';

/**
 * Sanitize strings by escaping HTML special characters to mitigate XSS risks in user inputs
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

export const cleanText = purifyCleanText;

const sanitize = {
    sanitizeInput,
    cleanText
};

export default sanitize;

