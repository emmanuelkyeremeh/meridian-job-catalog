import { describe, it, expect } from 'vitest';
import { buildJobPublicPath, parseJobUrlSegment, JOB_URL_SEPARATOR } from './jobSlug.js';

describe('jobSlug', () => {
  it('builds path with separator and slug', () => {
    const p = buildJobPublicPath('abc123', 'Senior Engineer');
    expect(p).toContain('/jobs/');
    expect(decodeURIComponent(p.replace(/^\/jobs\//, ''))).toBe(
      `abc123${JOB_URL_SEPARATOR}senior-engineer`
    );
  });

  it('parses id-only segment', () => {
    const { id, hasSlug } = parseJobUrlSegment('abc123');
    expect(id).toBe('abc123');
    expect(hasSlug).toBe(false);
  });

  it('parses id--slug segment', () => {
    const tail = `abc123${JOB_URL_SEPARATOR}engineer`;
    const { id, hasSlug, slugPart } = parseJobUrlSegment(encodeURIComponent(tail));
    expect(id).toBe('abc123');
    expect(hasSlug).toBe(true);
    expect(slugPart).toBe('engineer');
  });
});
