export const EXPERIENCE_LEVELS = Object.freeze([
  'intern',
  'entry',
  'mid',
  'senior',
  'lead',
  'executive',
  'unknown',
]);

export const EXPERIENCE_LABELS = Object.freeze({
  intern: 'Internship',
  entry: 'Entry / Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  lead: 'Lead / Staff / Principal',
  executive: 'Director / Executive',
  unknown: 'Not specified',
});

export function classifyExperienceLevel(title = '', description = '') {
  const t = String(title).toLowerCase();
  const d = String(description).slice(0, 14_000).toLowerCase();

  if (/\b(intern(ship)?|co-?op)\b/i.test(t)) {
    return 'intern';
  }

  if (
    /\b(chief|vice president|\bvp\b|\bevp\b|\bsvp\b|\bcto\b|\bcfo\b|\bceo\b|\bcmo\b|\bcoo\b|head of|director of)\b/i.test(t) ||
    (/\bdirector\b/i.test(t) && !/\bassociate director\b/i.test(t))
  ) {
    return 'executive';
  }

  if (
    /\b(principal\b|staff engineer|distinguished|technical lead|tech lead)\b/i.test(t) ||
    (/\blead\b/i.test(t) &&
      /\b(software|engineer|developer|product|design|data|ml|devops|sre|security)\b/i.test(t))
  ) {
    return 'lead';
  }

  if (/\b(senior|sr\.|\bsr\b|\biii\b|\biv\b)\b/i.test(t)) {
    return 'senior';
  }

  if (/\b(junior|jr\.|\bjr\b|graduate|entry-level|entry level)\b/i.test(t)) {
    return 'entry';
  }

  if (/\bassociate\b/i.test(t) && !/\bsenior associate\b/i.test(t)) {
    return 'entry';
  }

  if (/\bmid[\s-]?level\b|\bintermediate\b/i.test(t)) {
    return 'mid';
  }

  const years = extractYearsFromDescription(d);
  if (years !== null) {
    if (years <= 1) return 'entry';
    if (years <= 4) return 'mid';
    if (years <= 8) return 'senior';
    return 'lead';
  }

  if (/\b(intern(ship)?|co-?op)\b/i.test(d.slice(0, 2000))) {
    return 'intern';
  }

  return 'unknown';
}

function extractYearsFromDescription(text) {
  if (!text) return null;
  let max = null;

  const patterns = [
    /(\d+)\s*\+\s*years?\s*(?:of\s*)?(?:relevant\s*)?(?:experience|exp)\b/gi,
    /(\d+)\s*-\s*(\d+)\s*years?\s*(?:of\s*)?(?:experience|exp)\b/gi,
    /(\d+)\s*years?\s*(?:of\s*)?(?:relevant\s*)?(?:experience|exp)\b/gi,
    /minimum\s*(?:of\s*)?(\d+)\s*years?\s*(?:of\s*)?(?:experience|exp)?/gi,
    /at least\s*(\d+)\s*years?/gi,
    /(\d+)\s*\+\s*yrs?\b/gi,
  ];

  for (const re of patterns) {
    const matches = [...text.matchAll(re)];
    for (const m of matches) {
      const a = Number(m[1]);
      const b = m[2] !== undefined ? Number(m[2]) : a;
      if (Number.isFinite(a)) {
        const n = Number.isFinite(b) ? Math.max(a, b) : a;
        max = max === null ? n : Math.max(max, n);
      }
    }
  }

  return max;
}

export function parseExperienceFilter(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => EXPERIENCE_LEVELS.includes(s));
}
