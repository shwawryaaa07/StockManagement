import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to allow only safe presentation tags.
 * Protects against XSS injection in user-supplied invoice notes and custom remarks.
 *
 * @param {string} dirty - The raw HTML/string to sanitize
 * @param {object} [customConfig] - Optional DOMPurify configuration overrides
 * @returns {string} Sanitized HTML safe for rendering
 */
export function sanitizeHtml(dirty, customConfig = {}) {
    if (!dirty || typeof dirty !== 'string') return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'span', 'small'],
        ALLOWED_ATTR: ['class'],
        ...customConfig
    });
}

/**
 * Strips all HTML tags and invisible/control characters.
 * Ensures clean, safe plain text for receipts, print slips, and WhatsApp messages.
 * Note: .trim() is performed *after* stripping control characters to prevent trailing whitespace.
 *
 * @param {string} dirty - The text containing potential HTML or control characters
 * @returns {string} Clean plain text
 */
export function cleanText(dirty) {
    if (!dirty) return '';
    const str = String(dirty);
    // Strip any HTML tags via DOMPurify
    const stripped = DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
    // Remove control/non-printable ASCII characters (U+0000 to U+001F and U+007F to U+009F)
    // eslint-disable-next-line no-control-regex
    const withoutControls = stripped.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // In DOM environment, decode HTML entities like &amp; -> &
    if (typeof document !== 'undefined' && document.createElement) {
        const txt = document.createElement('textarea');
        txt.innerHTML = withoutControls;
        return txt.value.trim();
    }
    // Trim only after control characters are stripped
    return withoutControls.trim();
}

const purify = {
    sanitizeHtml,
    cleanText
};

export default purify;

