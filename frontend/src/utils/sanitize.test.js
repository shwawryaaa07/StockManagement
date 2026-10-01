import { sanitizeInput, cleanText } from './sanitize';

describe('Sanitization utilities', () => {
    test('sanitizeInput escapes HTML special characters', () => {
        const malicious = '<script>alert("xss")</script>';
        const sanitized = sanitizeInput(malicious);
        expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    test('cleanText trims whitespace and strips non-printable characters', () => {
        const input = '  Customer Name \x00\x1F ';
        const cleaned = cleanText(input);
        expect(cleaned).toBe('Customer Name');
    });

    test('cleanText handles non-string gracefully', () => {
        expect(cleanText(null)).toBe('');
        expect(cleanText(undefined)).toBe('');
    });
});
