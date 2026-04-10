/** Separator between opaque job id and human-readable slug in `/jobs/...` URLs. */
export const JOB_URL_SEPARATOR = '--';

const MAX_SLUG_LEN = 72;

/**
 * @param {string} [title]
 */
export function jobTitleToSlugPart(title) {
  if (!title || typeof title !== 'string') return 'job';
  const s = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LEN);
  return s || 'job';
}

/**
 * Canonical public path for a job (one path segment after /jobs/).
 * @param {string|number} id
 * @param {string} [title]
 */
export function buildJobPublicPath(id, title) {
  if (id == null || id === '') return '/jobs';
  const slug = jobTitleToSlugPart(title);
  const tail = `${String(id)}${JOB_URL_SEPARATOR}${slug}`;
  return `/jobs/${encodeURIComponent(tail)}`;
}

/**
 * @param {string} encodedSegment - value of :jobKey from the URL (may be encoded)
 * @returns {{ id: string, hasSlug: boolean, slugPart: string }}
 */
export function parseJobUrlSegment(encodedSegment) {
  if (!encodedSegment || typeof encodedSegment !== 'string') {
    return { id: '', hasSlug: false, slugPart: '' };
  }
  let segment = encodedSegment;
  try {
    segment = decodeURIComponent(encodedSegment);
  } catch {
    segment = encodedSegment;
  }
  const sep = JOB_URL_SEPARATOR;
  const idx = segment.indexOf(sep);
  if (idx === -1) {
    return { id: segment, hasSlug: false, slugPart: '' };
  }
  const id = segment.slice(0, idx);
  const slugPart = segment.slice(idx + sep.length);
  return { id, hasSlug: slugPart.length > 0, slugPart };
}
