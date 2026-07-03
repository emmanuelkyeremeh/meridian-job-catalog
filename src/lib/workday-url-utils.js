/**
 * Normalize Workday URLs from Common Crawl (job pages, CXS API paths) to board URLs.
 */

const WORKDAY_CXS_RE = /myworkdayjobs\.com\/wday\/cxs\/([^/]+)\/([^/?#]+)/i;
const WORKDAY_HOST_RE = /^(https?:\/\/[a-z0-9-]+\.wd\d+\.myworkdayjobs\.com)/i;

const INVALID_SITES = new Set([
  'wday',
  'cxs',
  'jobs',
  'job',
  'login',
  'logout',
  'signin',
  'assets',
  'static',
  'help',
  'api',
]);

/**
 * @param {string} url
 * @returns {string[]}
 */
export function expandWorkdaySourceUrls(url) {
  const raw = String(url || '').trim();
  if (!raw || !/myworkdayjobs\.com/i.test(raw)) return [];
  const out = [raw];
  const cxs = raw.match(WORKDAY_CXS_RE);
  if (cxs) {
    const host = raw.match(WORKDAY_HOST_RE)?.[1];
    if (host) out.push(`${host}/en-US/${cxs[2]}`);
  }
  return out;
}

/**
 * @param {string} boardUrl
 * @returns {boolean}
 */
export function isPlausibleWorkdayBoardUrl(boardUrl) {
  const site = String(boardUrl || '').split('/').filter(Boolean).pop() || '';
  return site.length >= 2 && !INVALID_SITES.has(site.toLowerCase());
}
