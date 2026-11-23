import { describe, expect, it } from 'vitest';
import { suggestionsFor } from './NotFoundView';

const targets = (path: string) => suggestionsFor(path).map((s) => s.to);

describe('suggestionsFor', () => {
  it('points a mistyped job-title URL at the example that exists', () => {
    expect(targets('/resume_tmpl/front-end-developer/')[0]).toBe('/resume_tmpl/frontend-developer/');
    expect(targets('/resume_tmpl/registered-nurses/')).toEqual(['/resume_tmpl/registered-nurse-rn/']);
    expect(targets('/resume_tmpl/sr-data-scientist/')).toEqual(['/resume_tmpl/senior-data-scientist/']);
    // No title has every word: the longest title made of its words.
    expect(targets('/resume_tmpl/software-engineer-ii/')).toEqual(['/resume_tmpl/software-engineer/']);
  });

  it('suggests templates by display name, and nothing for unrelated or broken URLs', () => {
    expect(targets('/templates/ledger/')).toEqual(['/templates/banking/']);
    expect(targets('/templates/classic-2/')).toEqual(['/templates/classic/']);
    expect(targets('/resume_tmpl/qwerty/')).toEqual([]);
    expect(targets('/resume_tmpl/%E0%A4%A/')).toEqual([]);
    expect(targets('/blog/front-end-developer/')).toEqual([]);
  });
});
