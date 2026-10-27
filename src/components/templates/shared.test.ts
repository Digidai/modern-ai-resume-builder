import { describe, expect, it } from 'vitest';
import { groupSkills } from './shared';

describe('groupSkills', () => {
  it('splits a category on top-level separators but keeps commas inside parentheses', () => {
    expect(groupSkills(['Cloud: AWS (ECS, Lambda, S3), GCP; Terraform', 'Figma'])).toEqual([
      { category: 'Cloud', items: ['AWS (ECS, Lambda, S3)', 'GCP', 'Terraform'] },
      { category: '', items: ['Figma'] },
    ]);
  });
});
