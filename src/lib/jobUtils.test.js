import { describe, it, expect } from 'vitest';
import { normalizeJobUrl, jobIdFromUrl } from './jobUtils.js';

describe('normalizeJobUrl', () => {
  it('trims whitespace', () => {
    expect(normalizeJobUrl('  https://example.com/job  ')).toBe('https://example.com/job');
  });

  it('strips trailing slashes', () => {
    expect(normalizeJobUrl('https://example.com/job/')).toBe('https://example.com/job');
    expect(normalizeJobUrl('https://example.com/job///')).toBe('https://example.com/job');
  });

  it('returns empty string for non-string input', () => {
    expect(normalizeJobUrl(null)).toBe('');
    expect(normalizeJobUrl(undefined)).toBe('');
    expect(normalizeJobUrl(123)).toBe('');
    expect(normalizeJobUrl({})).toBe('');
  });

  it('preserves valid URLs without trailing slash', () => {
    expect(normalizeJobUrl('https://example.com/job/123')).toBe('https://example.com/job/123');
  });

  it('handles empty string', () => {
    expect(normalizeJobUrl('')).toBe('');
    expect(normalizeJobUrl('   ')).toBe('');
  });
});

describe('jobIdFromUrl', () => {
  it('produces a stable hash for a given URL', () => {
    const id1 = jobIdFromUrl('https://example.com/job/1');
    const id2 = jobIdFromUrl('https://example.com/job/1');
    expect(id1).toBe(id2);
  });

  it('produces different hashes for different URLs', () => {
    const id1 = jobIdFromUrl('https://example.com/job/1');
    const id2 = jobIdFromUrl('https://example.com/job/2');
    expect(id1).not.toBe(id2);
  });

  it('normalizes before hashing (trailing slash does not change id)', () => {
    const id1 = jobIdFromUrl('https://example.com/job/1');
    const id2 = jobIdFromUrl('https://example.com/job/1/');
    expect(id1).toBe(id2);
  });

  it('returns empty string for invalid input', () => {
    expect(jobIdFromUrl(null)).toBe('');
    expect(jobIdFromUrl('')).toBe('');
    expect(jobIdFromUrl('   ')).toBe('');
  });

  it('produces a hash no longer than 64 characters', () => {
    const id = jobIdFromUrl('https://example.com/very/long/path/to/job/posting/with/many/segments');
    expect(id.length).toBeLessThanOrEqual(64);
    expect(id.length).toBeGreaterThan(0);
  });
});
