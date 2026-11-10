import { describe, expect, it } from 'vitest';
import { validateEmail, validatePhone } from './validation';
import { telHref } from '../components/templates/shared';

describe('validatePhone', () => {
  it('accepts the separators and extensions real numbers are written with', () => {
    for (const phone of ['+1 (555) 012-3456', '555.012.3456', '+1.555.012.3456', '06.12.34.56.78', '030/123456', '+49 (0)30 123456', '+86 138 0013 8000', '(555) 012-3456 ext. 12', '555-0123 x12', '555 0123 #4']) {
      expect(validatePhone(phone), phone).toBe(true);
    }
  });

  it('rejects text that is not a phone number', () => {
    for (const phone of ['call me', '555-CALL', '()', '+1', 'pat@example.com', '555 0123 ext.']) {
      expect(validatePhone(phone), phone).toBe(false);
    }
  });
});

describe('validateEmail', () => {
  it('ignores spaces around a pasted address but not inside it', () => {
    expect(validateEmail(' pat@example.com ')).toBe(true);
    expect(validateEmail('pat lee@example.com')).toBe(false);
  });
});

describe('telHref', () => {
  it('keeps an extension out of the dialled number', () => {
    expect(telHref('+1 (555) 012-3456')).toBe('tel:+15550123456');
    expect(telHref('555.012.3456 ext. 12')).toBe('tel:5550123456;ext=12');
    expect(telHref('555 0123 x12')).toBe('tel:5550123;ext=12');
  });
});
