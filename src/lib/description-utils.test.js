import { describe, it, expect } from 'vitest';
import { sanitizeDescription } from './description-utils.js';

describe('sanitizeDescription', () => {
  it('decodes double-encoded ATS HTML entities', () => {
    const raw =
      "What You&apos&semi;ll Do Avalara is seeking a Security Engineer&period; &&num;xA0&semi;In this role you will design&comma; implement tooling &lpar;SDLC&rpar;&period;";
    const out = sanitizeDescription(raw);
    expect(out).toContain("You'll");
    expect(out).toContain('Security Engineer.');
    expect(out).toContain('design, implement');
    expect(out).toContain('(SDLC).');
    expect(out).not.toContain('&semi;');
    expect(out).not.toContain('&period;');
  });
});
