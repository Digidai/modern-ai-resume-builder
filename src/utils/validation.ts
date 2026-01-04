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
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
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
