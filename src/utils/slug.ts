export const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const slugifyJobTitle = (title: string): string => {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const toTitleCase = (value: string): string => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const alnum = word.replace(/[^a-zA-Z0-9]/g, '');
      if (alnum && alnum === alnum.toUpperCase() && alnum.length <= 4) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const humanizeSlug = (slug: string): string => {
  const decoded = safeDecodeURIComponent(slug);
  return toTitleCase(decoded.replace(/[-_]+/g, ' ').trim());
};

export const findJobTitleBySlug = (slug: string, titles: readonly string[]): string | null => {
  const normalized = slugifyJobTitle(safeDecodeURIComponent(slug));
  for (const title of titles) {
    if (slugifyJobTitle(title) === normalized) return title;
  }
  return null;
};

