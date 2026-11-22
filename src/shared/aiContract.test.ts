import { describe, expect, it } from 'vitest';
import { finishAiText } from './aiContract';

describe('finishAiText', () => {
  it('turns numbers the input wrote as digits back into digits, and keeps bullets', () => {
    const input = '- Split the monolith into 6 services\n- Led 15 postmortems';
    expect(finishAiText('Split the monolith into six services\nDirected Fifteen postmortems', input)).toBe(
      '- Split the monolith into 6 services\n- Directed 15 postmortems'
    );
  });

  it('leaves words alone when the input has no matching standalone digit or spelled the word out', () => {
    // "16" and "6.5" contain a 6 but are other numbers; "three" was already a word in the input.
    expect(finishAiText('Cut six steps from three teams', 'Cut steps to 16 from 6.5 hours across three teams')).toBe(
      'Cut six steps from three teams'
    );
  });
});
