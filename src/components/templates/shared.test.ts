import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Authors, groupSkills } from './shared';

describe('groupSkills', () => {
  it('splits a category on top-level separators but keeps commas inside parentheses', () => {
    expect(groupSkills(['Cloud: AWS (ECS, Lambda, S3), GCP; Terraform', 'Figma'])).toEqual([
      { category: 'Cloud', items: ['AWS (ECS, Lambda, S3)', 'GCP', 'Terraform'] },
      { category: '', items: ['Figma'] },
    ]);
  });
});

describe('Authors', () => {
  const bolded = (authors: string, owner: string) =>
    Array.from(renderToStaticMarkup(createElement(Authors, { authors, owner })).matchAll(/<strong[^>]*>(.*?)<\/strong>/g), (m) => m[1]);

  it('bolds only the owner, in any common name format', () => {
    // A coauthor with the same surname but another initial stays plain.
    expect(bolded('Lee, C., Lee, P., Patel, K.', 'Pat Lee')).toEqual(['Lee, P.']);
    expect(bolded('Chen J, P. Lee, Okafor N', 'Pat Lee')).toEqual(['P. Lee']);
    expect(bolded('Pat Lee and Jun Chen', 'pat lee')).toEqual(['Pat Lee']);
    expect(bolded('Chen, J., Okafor, N.', 'Pat Lee')).toEqual([]);
  });
});
