/**
 * Extract baseSalary for JobPosting JSON-LD from salary fields or description text.
 */

const SALARY_PATTERNS = [
  {
    re: /(?:£|GBP)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s*[-–—to]+\s*(?:£|GBP)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?(?:\s*(?:\/|per)\s*(year|yr|month|mo|hour|hr))?/i,
    currency: 'GBP',
  },
  {
    re: /(?:€|EUR)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s*[-–—to]+\s*(?:€|EUR)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?(?:\s*(?:\/|per)\s*(year|yr|month|mo|hour|hr))?/i,
    currency: 'EUR',
  },
  {
    re: /(?:\$|USD|US\$)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)(?:\s*[-–—to]+\s*(?:\$|USD|US\$)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?))?(?:\s*(?:\/|per)\s*(year|yr|month|mo|hour|hr))?/i,
    currency: 'USD',
  },
];

function parseAmount(raw) {
  const n = Number(String(raw || '').replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function unitFromMatch(m) {
  const u = String(m || '').toLowerCase();
  if (u.startsWith('hour') || u === 'hr') return 'HOUR';
  if (u.startsWith('month') || u === 'mo') return 'MONTH';
  return 'YEAR';
}

/**
 * @param {{ salary?: string, compensation?: string, description?: string }} job
 * @returns {object|null} schema.org MonetaryAmount
 */
export function parseSalaryForJobPosting(job) {
  const sources = [job?.salary, job?.compensation, job?.description].filter(Boolean);
  for (const raw of sources) {
    const text = String(raw);
    for (const { re, currency } of SALARY_PATTERNS) {
      const m = text.match(re);
      if (!m) continue;
      const min = parseAmount(m[1]);
      if (!min) continue;
      const max = parseAmount(m[2]);
      const unitText = unitFromMatch(m[3]);
      const value =
        max && max > min
          ? { '@type': 'QuantitativeValue', minValue: min, maxValue: max, unitText }
          : { '@type': 'QuantitativeValue', value: min, unitText };
      return { '@type': 'MonetaryAmount', currency, value };
    }
  }
  return null;
}
