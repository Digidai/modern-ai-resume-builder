export const validateEmail = (email: string): boolean => {
  if (!email) return true;
  // Pasted addresses often carry a stray space at either end.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Digits with the separators people write around the world (spaces, dashes, dots as in "555.012.3456" or
 * "06.12.34.56.78", a slash as in "030/123456", brackets, a leading +), an optional extension ("ext. 12",
 * "x12", "#12"), and at least 4 digits.
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  const match = /^\s*(\+?[\d\s\-.\/()]+?)(?:\s*(?:ext\.?|x|#)\s*\d{1,6})?\s*$/i.exec(phone);
  return !!match && (match[1].match(/\d/g)?.length ?? 0) >= 4;
};

export const validateUrl = (url: string): boolean => {
  if (!url) return true;
  const value = url.trim();
  // No spaces, and a real host with a dot (or localhost); scheme optional.
  if (/\s/.test(value)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) return false;
  try {
    const { hostname } = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(hostname) || hostname === 'localhost';
  } catch {
    return false;
  }
};

export const getEmailError = (email: string): string | undefined => {
  if (email && !validateEmail(email)) {
    return 'Invalid email format';
  }
  return undefined;
};

export const getPhoneError = (phone: string): string | undefined => {
  if (phone && !validatePhone(phone)) {
    return 'Invalid phone format';
  }
  return undefined;
};

export const getUrlError = (url: string): string | undefined => {
  if (url && !validateUrl(url)) {
    return 'Invalid URL format';
  }
  return undefined;
};
