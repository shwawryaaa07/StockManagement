import { sanitizeHtml, cleanText } from './purify';

describe('purify utility', () => {
    describe('sanitizeHtml', () => {
        test('removes malicious script tags and inline execution vectors', () => {
            const malicious = '<script>alert("XSS")</script><b>Valid Bold Text</b><img src=x onerror=alert(1)>';
            const sanitized = sanitizeHtml(malicious);
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('onerror');
            expect(sanitized).toContain('<b>Valid Bold Text</b>');
        });

        test('preserves allowed HTML tags and structure', () => {
            const safeHtmlInput = '<p>Invoice <em>Notes</em>: <strong>Paid</strong></p>';
            expect(sanitizeHtml(safeHtmlInput)).toBe(safeHtmlInput);
        });

        test('returns empty string for null, undefined, or non-string inputs', () => {
            expect(sanitizeHtml(null)).toBe('');
            expect(sanitizeHtml(undefined)).toBe('');
            expect(sanitizeHtml(12345)).toBe('');
        });
    });

    describe('cleanText', () => {
        test('strips all HTML tags to pure text', () => {
            const html = '<div>Customer: <strong>John &amp; Doe</strong><br/></div>';
            expect(cleanText(html)).toBe('Customer: John & Doe');
        });

        test('removes invisible/control ASCII characters', () => {
            // \x00 (null byte), \x07 (bell), \x1B (escape)
            const withControls = 'Clean\x00Text\x07With\x1BControls';
            expect(cleanText(withControls)).toBe('CleanTextWithControls');
        });

        test('trims whitespace cleanly AFTER stripping control characters', () => {
            // If control character was at boundary, trailing spaces must be cleanly trimmed
            const boundaryControls = '   \x00  Surrounded Name \x1F   ';
            expect(cleanText(boundaryControls)).toBe('Surrounded Name');
        });

        test('handles null, undefined, or empty values safely', () => {
            expect(cleanText(null)).toBe('');
            expect(cleanText(undefined)).toBe('');
            expect(cleanText('')).toBe('');
        });
    });
});
