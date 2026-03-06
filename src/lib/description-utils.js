/**
 * Sanitize job descriptions for storage and AI: decode HTML entities, strip tags,
 * normalize unicode, collapse whitespace. Use for ATS API and HTML-extracted content.
 */

/** Return true if text looks like CSS or styled markup (not a real job description). */
export function isLikelyCssOrGarbage(text) {
  if (!text || typeof text !== 'string' || text.length < 50) return false;
  const s = text.slice(0, 2000);
  const cssLike =
    (s.match(/\.css-[a-z0-9]+\s*\{/g) || []).length >= 2 ||
    (s.match(/\b(?:box-sizing|margin-block|inline-size|block-size|var\(--)/g) || []).length >= 3 ||
    (s.match(/\{[^}]*\}/g) || []).length >= 5;
  if (cssLike) return true;
  const garbageRatio = (s.match(/[{};:]/g) || []).length / s.length;
  return garbageRatio > 0.08;
}

/** Decode common HTML entities (including numeric). */
function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return '';
  let out = text
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );
  out = out.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCodePoint(parseInt(dec, 10))
  );
  return out;
}

/** Remove HTML tags. */
function stripHtmlTags(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ' ').trim();
}

/** Normalize unicode quotes/dashes to ASCII equivalents. */
function normalizeUnicode(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, ' - ')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ');
}

/** Collapse runs of whitespace to single space and trim. */
function collapseWhitespace(s) {
  if (!s || typeof s !== 'string') return '';
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize a job description: decode entities, strip HTML, normalize unicode, collapse space.
 * @param {string} raw - Raw description (HTML or plain text)
 * @param {number} maxLength - Max length to return (default no limit)
 * @returns {string} Sanitized plain text, or empty string
 */
export function sanitizeDescription(raw, maxLength = 0) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim();
  if (!s) return '';
  if (isLikelyCssOrGarbage(s)) return '';
  s = decodeHtmlEntities(s);
  s = stripHtmlTags(s);
  s = normalizeUnicode(s);
  s = collapseWhitespace(s);
  if (isLikelyCssOrGarbage(s)) return '';
  if (maxLength > 0 && s.length > maxLength) {
    s = s.slice(0, maxLength);
    const lastSpace = s.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) s = s.slice(0, lastSpace);
  }
  return s;
}
