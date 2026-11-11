import { describe, expect, it } from 'vitest';
import { publicationTitleKey } from './publicationTitle';

describe('publicationTitleKey', () => {
  it('matches the same title despite case, punctuation and accents', () => {
    expect(publicationTitleKey('Étude des réseaux: une approche')).toBe(publicationTitleKey('Etude des Reseaux — une approche.'));
    expect(publicationTitleKey('深度学习综述。')).toBe(publicationTitleKey('深度学习综述'));
  });

  it('tells apart different titles in any script', () => {
    // These all reduced to "" before, so every non-Latin work looked like the same one.
    const keys = ['深度学习综述', '图神经网络研究', 'Обзор методов', 'ニューラルネット', 'किताब', 'कुतुब'].map(publicationTitleKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every(Boolean)).toBe(true);
  });

  it('is empty for a title with no letters or digits', () => {
    expect(publicationTitleKey('')).toBe('');
    expect(publicationTitleKey(' — ')).toBe('');
  });
});
