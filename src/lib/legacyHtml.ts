import type { SiteSettings } from './siteContent';

type LegacyMetaOptions = {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
};

const escapeAttribute = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const upsertTag = (html: string, pattern: RegExp, tag: string): string => {
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace('</head>', `    ${tag}\n</head>`);
};

export const applyLegacyHeadMeta = (html: string, site: SiteSettings, options: LegacyMetaOptions = {}): string => {
  const title = escapeAttribute(options.title ?? site.seo.title);
  const description = escapeAttribute(options.description ?? site.seo.description);
  const image = new URL(options.image ?? site.seo.image, site.seo.canonicalBaseUrl).toString();
  const canonical = new URL(options.canonical ?? '/', site.seo.canonicalBaseUrl).toString();
  const favicon = escapeAttribute(site.seo.favicon);

  let output = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);

  output = upsertTag(
    output,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${description}">`,
  );
  output = upsertTag(output, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  output = upsertTag(output, /<link\s+rel=["']icon["'][^>]*>/i, `<link rel="icon" href="${favicon}">`);
  output = upsertTag(output, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${title}">`);
  output = upsertTag(
    output,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${description}">`,
  );
  output = upsertTag(output, /<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${image}">`);

  return output;
};
