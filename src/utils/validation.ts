export const validateEmail = (email: string): boolean => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  return /^[\d\s\-+()]+$/.test(phone);
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
