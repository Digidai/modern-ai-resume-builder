import { describe, expect, it } from 'vitest';
import { validateEmail, validatePhone, validateUrl } from './validation';
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

describe('validateUrl', () => {
  it('accepts domains in any script and addresses with a port', () => {
    for (const url of ['пример.рф', 'https://例子.中国/about', 'münchen.de', 'pat.dev:8080/demo', 'localhost:3000', 'https://pat.dev']) {
      expect(validateUrl(url), url).toBe(true);
    }
  });

  it('rejects other schemes, spaces and hosts without a domain', () => {
    for (const url of ['mailto:pat@pat.dev', 'javascript:alert(1)', 'ftp://pat.dev', 'pat dev.com', 'pat', 'pat.d']) {
      expect(validateUrl(url), url).toBe(false);
    }
  });
});

describe('telHref', () => {
  it('keeps an extension out of the dialled number', () => {
    expect(telHref('+1 (555) 012-3456')).toBe('tel:+15550123456');
    expect(telHref('555.012.3456 ext. 12')).toBe('tel:5550123456;ext=12');
    expect(telHref('555 0123 x12')).toBe('tel:5550123;ext=12');
  });
});
