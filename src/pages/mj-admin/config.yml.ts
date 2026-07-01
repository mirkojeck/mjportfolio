import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getSiteSettings } from '@lib/siteContent';

const normalizeSiteUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const GET = () => {
  const site = getSiteSettings();
  const source = readFileSync(resolve(process.cwd(), 'src/mj-admin/config.yml'), 'utf8');
  const siteUrl = normalizeSiteUrl(site.brand.domain || site.seo.canonicalBaseUrl);
  const dynamicSiteConfig = siteUrl ? `site_url: ${siteUrl}\ndisplay_url: ${siteUrl}\n` : '';

  return new Response(source.replace('local_backend: true\n', `local_backend: true\n${dynamicSiteConfig}`), {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
    },
  });
};
