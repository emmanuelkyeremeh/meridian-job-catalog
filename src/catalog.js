import { classifyAfricaJobRules } from './lib/africa-rules-classifier.js';
import { sanitizeDescription } from './lib/description-utils.js';
import { classifyExperienceLevel, parseExperienceFilter } from './lib/jobExperience.js';
import { jobIdFromUrl } from './lib/jobUtils.js';
import { buildJobPublicPath } from './lib/jobSlug.js';
import { parseSalaryForJobPosting } from './lib/salarySchema.js';

// Explicit allowlist: input records cannot carry CVs, emails or arbitrary user fields into output.
export function normalizeListing(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Each job must be an object.');
  for (const key of ['title', 'company', 'location', 'description', 'url']) {
    if (typeof input[key] !== 'string') throw new Error(`Job ${key} must be a string.`);
    if (input[key].length > 100_000) throw new Error(`Job ${key} is too long.`);
  }
  const url = new URL(input.url);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Job URL must use HTTP(S) without embedded credentials.');
  }
  url.hash = '';
  const job = {
    title: input.title.trim(), company: input.company.trim(), location: input.location.trim(),
    description: sanitizeDescription(input.description), url: url.toString(),
    salary: typeof input.salary === 'string' ? input.salary.slice(0, 500) : '',
  };
  if (!job.title || !job.company) throw new Error('Job title and company cannot be empty.');
  job.id = jobIdFromUrl(job.url);
  return { ...job, experience: classifyExperienceLevel(job.title, job.description),
    eligibility: classifyAfricaJobRules(job), path: buildJobPublicPath(job.id, job.title),
    baseSalary: parseSalaryForJobPosting(job) };
}

export function buildCatalog(records, { q = '', experience = '', verdict = 'all' } = {}) {
  if (!Array.isArray(records)) throw new Error('Input must be a JSON array of job listings.');
  if (records.length > 50_000) throw new Error('Maximum 50,000 job listings per file.');
  if (!['all', 'yes', 'no', 'review'].includes(verdict)) throw new Error('Invalid verdict filter.');
  const levels = parseExperienceFilter(experience);
  if (experience && levels.length === 0) throw new Error('Unknown experience filter.');
  const unique = new Map();
  records.forEach((record, index) => {
    try { const job = normalizeListing(record); if (!unique.has(job.id)) unique.set(job.id, job); }
    catch (error) { throw new Error(`Record ${index + 1}: ${error.message}`); }
  });
  const jobs = [...unique.values()];
  const stats = { input: records.length, unique: jobs.length, duplicates: records.length - jobs.length,
    yes: 0, no: 0, review: 0 };
  jobs.forEach(job => { stats[job.eligibility.verdict] += 1; });
  const query = String(q).trim().toLowerCase();
  const filtered = jobs.filter(job =>
    (!query || [job.title, job.company, job.location, job.description].join(' ').toLowerCase().includes(query)) &&
    (!levels.length || levels.includes(job.experience)) &&
    (verdict === 'all' || verdict === job.eligibility.verdict));
  return { stats: { ...stats, returned: filtered.length }, jobs: filtered };
}
