const PUBLIC_PREFIXES = ['public/', './public/', '/public/'];

export const normalizeImagePath = (value?: string | null): string => {
  if (!value) return '';

  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (/^(https?:)?\/\//i.test(trimmed) || /^(data|blob):/i.test(trimmed)) {
    return trimmed;
  }

  const withoutPublic = PUBLIC_PREFIXES.reduce((current, prefix) => {
    if (!current.startsWith(prefix)) return current;
    return current.replace(prefix, prefix.startsWith('/') ? '/' : '');
  }, trimmed);

  if (withoutPublic.startsWith('/')) return withoutPublic;
  if (withoutPublic.startsWith('img/')) return `/${withoutPublic}`;
  if (withoutPublic.startsWith('uploads/')) return `/img/${withoutPublic}`;

  return withoutPublic;
};

const IMAGE_KEYS = new Set(['image', 'cover', 'quoteImage', 'favicon', 'light', 'dark', 'footer', 'fallback']);

export const normalizeImageFields = <T>(value: T, key = ''): T => {
  if (typeof value === 'string') {
    return (IMAGE_KEYS.has(key) ? normalizeImagePath(value) : value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeImageFields(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, normalizeImageFields(entryValue, entryKey)])
    ) as T;
  }

  return value;
};
