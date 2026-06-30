import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mirko-portfolio.vercel.app',
  output: 'static',
  integrations: [sitemap()],
});
