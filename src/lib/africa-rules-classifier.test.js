import { describe, it, expect } from 'vitest';
import { classifyAfricaJobRules, localModelYesAllowed } from './africa-rules-classifier.js';

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

  it('rejects sparse jobs missing location and description', () => {
    const result = classifyAfricaJobRules({
      title: 'Chief Financial Officer',
      company: 'Applied Physics',
      location: '',
      description: '',
    });
    expect(result.verdict).toBe('no');
    expect(result.reason).toBe('missing-location-and-description');
  });

  it('rejects on-site US roles', () => {
    const result = classifyAfricaJobRules({
      title: 'Chief Financial Officer',
      company: 'Applied Physics',
      location: 'New York, New York, United States',
      description: 'On-site Full time. Seeking a seasoned CFO in New York.',
    });
    expect(result.verdict).toBe('no');
  });

  it('sends bare Remote to LLM review queue by default', () => {
    const result = classifyAfricaJobRules({
      title: 'Platform Engineer',
      company: 'Co',
      location: 'Remote',
      description: 'Join our engineering team building APIs.',
    });
    expect(result.verdict).toBe('review');
    expect(result.reason).toBe('vague-remote-no-scope');
  });

  // --- US/Canada leakage regression tests ---

  it('rejects "Remote - US" jobs whose body says "remote-first" (weak signal must not rescue)', () => {
    const result = classifyAfricaJobRules({
      title: 'Senior Software Engineer',
      company: 'USCo',
      location: 'Remote - US',
      description:
        'We are a remote-first company. You will build distributed systems. Competitive salary and 401k.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects US-remote jobs that mention employer of record in benefits', () => {
    const result = classifyAfricaJobRules({
      title: 'Product Manager',
      company: 'USCo',
      location: 'United States (Remote)',
      description:
        'Work remotely from anywhere in the US. We use an employer of record for payroll and offer global payroll support for our US entities.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects Canada-only remote jobs with culture boilerplate', () => {
    const result = classifyAfricaJobRules({
      title: 'Data Engineer',
      company: 'CanCo',
      location: 'Canada - Remote',
      description: 'We are remote-first and async across all time zones in Canada. RRSP matching.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects state-level US remote locks like "Remote - New York, NY"', () => {
    const result = classifyAfricaJobRules({
      title: 'Account Executive',
      company: 'USCo',
      location: 'Remote - New York, NY',
      description: 'Sell to enterprise clients. We are a remote-first team.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects US-city remote locks like "Austin, TX (Remote)"', () => {
    const result = classifyAfricaJobRules({
      title: 'Customer Success Manager',
      company: 'USCo',
      location: 'Austin, TX (Remote)',
      description: 'Manage key accounts. Fully distributed team culture in the US.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects US-remote jobs that say "open to candidates anywhere in the U.S."', () => {
    const result = classifyAfricaJobRules({
      title: 'Migration & Implementation Lead',
      company: 'moxie',
      location: 'Remote - US',
      description:
        "At Moxie, we've grown to a global, remote-first team supporting 700+ practices nationwide. " +
        'This role is open to candidates anywhere in the U. S., though we have a strong preference for those based in or willing to work Eastern or Central time zones.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects US-metro-list remote locations with "globally distributed" boilerplate', () => {
    const result = classifyAfricaJobRules({
      title: 'Director, FP&A',
      company: 'ditto',
      location: 'Remote (Atlanta, Austin, San Francisco, Seattle)',
      description:
        'As a globally distributed, fast-growing startup, we are committed to building a diverse team. ' +
        'Trusted by Chick-fil-A, Delta Airlines, and the U.S. military.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects India-remote jobs (Remote, India)', () => {
    const result = classifyAfricaJobRules({
      title: 'Product Security Engineer',
      company: 'Avalara',
      location: 'Remote, India',
      description: 'Application security engineer role for our India engineering hub. '.repeat(3),
    });
    expect(result.verdict).toBe('no');
  });

  it('does not auto-allow bare Remote with long description and no open-region signal', () => {
    const job = {
      title: 'Product Security Engineer',
      company: 'Avalara',
      location: 'Remote',
      description: 'Security engineer based in India. '.repeat(20),
    };
    expect(classifyAfricaJobRules(job).verdict).toBe('review');
    expect(localModelYesAllowed(job)).toBe(false);
  });

  it('still rescues a US-located job whose body explicitly opens to candidates outside the US', () => {
    const result = classifyAfricaJobRules({
      title: 'Support Engineer',
      company: 'GlobalCo',
      location: 'Remote - US',
      description:
        'Open to candidates outside the US as well — we hire from anywhere in the world.',
    });
    expect(result.verdict).toBe('yes');
  });

  it('still accepts Africa-located jobs', () => {
    const result = classifyAfricaJobRules({
      title: 'Operations Lead',
      company: 'AfricaCo',
      location: 'Nairobi, Kenya (Remote)',
      description: 'Lead operations for our Kenya team.',
    });
    expect(result.verdict).toBe('yes');
  });

  it('still accepts jobs naming Africa in the description when location is open', () => {
    const result = classifyAfricaJobRules({
      title: 'Community Manager',
      company: 'GlobalCo',
      location: 'Remote',
      description: 'We are hiring across Africa, Latin America, and Southeast Asia.',
    });
    expect(result.verdict).toBe('yes');
  });

  // --- "EMEA in the title, country-locked location" leakage (Dexcom "Remote Spain") ---

  it('rejects "Remote Spain" even when the title says EMEA (territory != eligibility)', () => {
    const result = classifyAfricaJobRules({
      title: 'EMEA Sr. Clinical Study Manager',
      company: 'Dexcom',
      location: 'Remote Spain',
      description:
        'As a Senior Clinical Trial Lead you will drive execution of clinical investigations across our global standards of care.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects "Remote Portugal" with an EMEA team description', () => {
    const result = classifyAfricaJobRules({
      title: 'Account Manager',
      company: 'EuroCo',
      location: 'Remote Portugal',
      description: 'Manage our EMEA book of business covering Europe, Middle East and Africa.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects "Remote - India" with global payroll boilerplate', () => {
    const result = classifyAfricaJobRules({
      title: 'Backend Engineer',
      company: 'GlobalCo',
      location: 'Remote - India',
      description: 'We support global payroll via Deel and are a remote-first company.',
    });
    expect(result.verdict).toBe('no');
  });

  it('rejects Middle East country locks like "Remote UAE"', () => {
    const result = classifyAfricaJobRules({
      title: 'Sales Director',
      company: 'GulfCo',
      location: 'Remote UAE',
      description: 'Drive sales across the EMEA region from our Dubai-aligned remote team.',
    });
    expect(result.verdict).toBe('no');
  });

  it('still accepts a genuinely worldwide role tagged with a country plus worldwide', () => {
    const result = classifyAfricaJobRules({
      title: 'EMEA Support Engineer',
      company: 'GlobalCo',
      location: 'Remote (Worldwide)',
      description: 'Support customers everywhere. We hire from anywhere in the world.',
    });
    expect(result.verdict).toBe('yes');
  });
});
