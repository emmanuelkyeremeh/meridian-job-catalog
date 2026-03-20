import { describe, it, expect } from 'vitest';
import { classifyExperienceLevel, parseExperienceFilter } from './jobExperience.js';

describe('classifyExperienceLevel', () => {
  it('detects senior from title', () => {
    expect(classifyExperienceLevel('Senior Software Engineer', '')).toBe('senior');
  });

  it('detects intern from title', () => {
    expect(classifyExperienceLevel('Software Engineering Intern', '')).toBe('intern');
  });

  it('detects executive from title', () => {
    expect(classifyExperienceLevel('VP of Engineering', '')).toBe('executive');
  });

  it('uses years in description when title is vague', () => {
    expect(
      classifyExperienceLevel('Developer', 'We need someone with 6+ years of experience in backend systems.')
    ).toBe('senior');
  });

  it('returns unknown when no signal', () => {
    expect(classifyExperienceLevel('Developer', 'Build things.')).toBe('unknown');
  });
});

describe('parseExperienceFilter', () => {
  it('parses comma-separated levels', () => {
    expect(parseExperienceFilter('senior,mid')).toEqual(['senior', 'mid']);
  });

  it('rejects invalid tokens', () => {
    expect(parseExperienceFilter('senior,hack')).toEqual(['senior']);
  });
});
