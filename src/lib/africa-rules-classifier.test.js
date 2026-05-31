import { describe, it, expect } from 'vitest';
import { classifyAfricaJobRules } from './africa-rules-classifier.js';

describe('classifyAfricaJobRules', () => {
  it('rejects EU-only remote roles by location', () => {
    const result = classifyAfricaJobRules({
      title: 'Staff Software Engineer',
      company: 'EDB',
      location: 'Remote Europe',
      description: 'Build PostgreSQL analytics tools.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects EU-only remote roles by description', () => {
    const result = classifyAfricaJobRules({
      title: 'Staff Software Engineer-Greenplum',
      company: 'EDB',
      location: 'Remote',
      description:
        'This position is 100% remote for candidates based in certain countries within EU. Design and develop PostgreSQL database features.',
    });
    expect(result.verdict).toBe('no');
  });

  it('still accepts explicit EMEA remote roles', () => {
    const result = classifyAfricaJobRules({
      title: 'Support Engineer',
      company: 'ExampleCo',
      location: 'Remote - EMEA',
      description: 'Support customers across Europe, Middle East, and Africa.',
    });
    expect(result.verdict).toBe('yes');
  });

  it('still accepts worldwide remote roles', () => {
    const result = classifyAfricaJobRules({
      title: 'Backend Engineer',
      company: 'ExampleCo',
      location: 'Remote Worldwide',
      description: 'Work from anywhere.',
    });
    expect(result.verdict).toBe('yes');
  });
});
