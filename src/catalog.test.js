import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { buildCatalog, normalizeListing } from './catalog.js';
const examples = JSON.parse(readFileSync(new URL('../examples/jobs.json', import.meta.url), 'utf8'));
describe('public catalogue workflow', () => {
  it('preserves ambiguous locations for manual review and rejects region locks', () => {
    const output = buildCatalog(examples);
    expect(output.stats).toEqual({ input: 5, unique: 5, duplicates: 0, yes: 3, no: 1, review: 1, returned: 5 });
  });
  it('deduplicates and combines text, experience and eligibility filters', () => {
    const output = buildCatalog([...examples, examples[0]], { q: 'backend', experience: 'entry', verdict: 'yes' });
    expect(output.stats.duplicates).toBe(1); expect(output.jobs).toHaveLength(1);
    expect(output.jobs[0].company).toBe('Example Savannah Tools');
  });
  it('does not copy arbitrary profile or secret fields into output', () => {
    const result = normalizeListing({ ...examples[0], email: 'fictional@example.test', cv: 'not exported', apiKey: 'test-placeholder' });
    expect(result).not.toHaveProperty('email'); expect(result).not.toHaveProperty('cv');
    expect(result).not.toHaveProperty('apiKey');
  });
  it('rejects non-web URLs and embedded URL credentials', () => {
    expect(() => normalizeListing({ ...examples[0], url: 'javascript:alert(1)' })).toThrow();
    expect(() => normalizeListing({ ...examples[0], url: 'https://sample:password@example.test/job' })).toThrow();
  });
  it('rejects invalid records and filters with actionable errors', () => {
    expect(() => buildCatalog({})).toThrow('JSON array');
    expect(() => buildCatalog([{ title: 'Incomplete' }])).toThrow('Record 1');
    expect(() => buildCatalog(examples, { verdict: 'maybe' })).toThrow('Invalid verdict');
  });
  it('runs the demo end to end without environment credentials', () => {
    const output = execFileSync(process.execPath, ['src/cli.js', 'examples/jobs.json', '--verdict', 'review'], { encoding: 'utf8', env: { PATH: process.env.PATH } });
    expect(JSON.parse(output).jobs).toHaveLength(1);
    const invalid = spawnSync(process.execPath, ['src/cli.js', 'examples/jobs.json', '--verdict', 'wrong'], { encoding: 'utf8' });
    expect(invalid.status).toBe(1); expect(invalid.stderr).toContain('Invalid verdict');
  });
});
