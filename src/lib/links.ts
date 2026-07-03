export type LinkAttrs = {
  href: string;
  target?: '_blank';
  rel?: 'noopener noreferrer';
  'data-no-swup'?: true;
};

const SPECIAL_URL_RE = /^(mailto:|tel:|sms:|whatsapp:|#)/i;
const ABSOLUTE_URL_RE = /^https?:\/\//i;

export const isExternalUrl = (href?: string | null): boolean => {
  if (!href) return false;
  const trimmed = href.trim();
  return ABSOLUTE_URL_RE.test(trimmed) || /^www\./i.test(trimmed);
};

export const normalizeUrl = (href?: string | null): string => {
  if (!href) return '#';

  const trimmed = href.trim();
  if (!trimmed) return '#';
  if (ABSOLUTE_URL_RE.test(trimmed) || SPECIAL_URL_RE.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  if (trimmed.startsWith('/')) return trimmed;

  return `/${trimmed.replace(/^\/+/, '')}`;
};

export const getLinkAttrs = (href?: string | null): LinkAttrs => {
  const normalized = normalizeUrl(href);
  const external = isExternalUrl(normalized);

  return {
    href: normalized,
    ...(external ? { target: '_blank' as const, rel: 'noopener noreferrer' as const, 'data-no-swup': true as const } : {}),
  };
};

export const isEnabledLink = <T extends { href?: string; enabled?: boolean }>(link: T): boolean =>
  link.enabled !== false && Boolean(normalizeUrl(link.href));
