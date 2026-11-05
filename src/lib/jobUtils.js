/**
 * Job URL helpers: normalize URL and derive stable id. Used to deduplicate catalogue records.
 */
import crypto from 'crypto';

/** Normalize URL to a stable string (strip trailing slash, trim). */
export function normalizeJobUrl(url) {
  if (typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
}

/** Stable job id from URL (safe for use as primary key or doc id). */
export function jobIdFromUrl(url) {
  const normalized = normalizeJobUrl(url);
  if (!normalized) return '';
  const hash = crypto.createHash('sha256').update(normalized).digest('base64url');
  return hash.slice(0, 64);
}
