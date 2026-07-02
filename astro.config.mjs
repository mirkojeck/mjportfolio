import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { LEGACY_HTML_REDIRECTS } from './src/lib/permalinks.mjs';

const siteSettings = YAML.parse(readFileSync('src/data/site.yml', 'utf8'));
const normalizeSiteUrl = (value) => {
  const trimmed = String(value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:4321';
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export default defineConfig({
  site: normalizeSiteUrl(siteSettings.brand?.domain || siteSettings.seo?.canonicalBaseUrl),
  output: 'static',
  redirects: {
    '/mj-admin': '/mj-admin/',
    ...LEGACY_HTML_REDIRECTS,
  },
  integrations: [sitemap()],
});
