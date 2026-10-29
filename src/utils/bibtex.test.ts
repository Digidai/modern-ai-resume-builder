import { describe, expect, it } from 'vitest';
import { formatAuthors, latexToText, parseBibtex } from './bibtex';

const strip = (pubs: ReturnType<typeof parseBibtex>) => pubs.map(({ id: _id, ...rest }) => rest);

describe('parseBibtex', () => {
  it('reads Google Scholar, DBLP and arXiv style entries', () => {
    const bib = `
% exported from Google Scholar
@string{neurips = "Advances in Neural Information Processing Systems"}
@inproceedings{lee2025sparse,
  title={Sparse {Attention} for Long Documents},
  author={Lee, Pat and Chen, Jun and M{\\"u}ller, Anna and others},
  booktitle=neurips,
  year={2025},
  doi = {https://doi.org/10.1000/xyz123}
}
@article{okafor_2023,
  author = "Ngozi Okafor and Pat Lee",
  title = "Design tokens: a {\\&} b --- revisited",
  journal = {Interactions},
  volume = 30, number = {4}, pages = {12--15},
  year = 2023,
  month = jun,
}
@misc{lee2022,
  title = {Small multiples},
  author = {Pat Lee},
  year = {2022},
  eprint = {2204.01234},
  archivePrefix = {arXiv},
}
@phdthesis{lee2026, author = {Lee, Pat}, title = {Learning to read long documents}, school = {Carnegie Mellon University}, year = {2026}}
@comment{ignored @article{fake, title={no}} }
@misc{empty, note = {no title or author}}
`;
    expect(strip(parseBibtex(bib))).toEqual([
      {
        authors: 'Lee, P., Chen, J., Müller, A., et al.',
        title: 'Sparse Attention for Long Documents',
        venue: 'Advances in Neural Information Processing Systems',
        year: '2025',
        link: 'doi.org/10.1000/xyz123',
      },
      { authors: 'Okafor, N., Lee, P.', title: 'Design tokens: a & b — revisited', venue: 'Interactions', year: '2023', link: '' },
      { authors: 'Lee, P.', title: 'Small multiples', venue: 'arXiv preprint arXiv:2204.01234', year: '2022', link: 'arxiv.org/abs/2204.01234' },
      { authors: 'Lee, P.', title: 'Learning to read long documents', venue: 'PhD thesis, Carnegie Mellon University', year: '2026', link: '' },
    ]);
  });

  it('keeps commas and "and" inside braces as part of one value', () => {
    const [pub] = parseBibtex('@article{x, author = {{Barnes and Noble, Inc.} and van der Berg, Jan Willem}, title = {T}, year = {2020}}');
    expect(pub.authors).toBe('Barnes and Noble, Inc., van der Berg, J. W.');
  });
});

describe('formatAuthors', () => {
  it('finds the surname in "First von Last" order and keeps hyphenated initials', () => {
    expect(formatAuthors('Ludwig van Beethoven and Jean-Paul Sartre')).toBe('van Beethoven, L., Sartre, J.-P.');
  });
});

describe('latexToText', () => {
  it('turns accents, escapes and font commands into plain text', () => {
    expect(latexToText("Erd\\H{o}s, G{\\\"o}del and \\'Eric \\textit{et al.} 50\\% $\\alpha$")).toBe('Erdős, Gödel and Éric et al. 50% α');
  });
});
