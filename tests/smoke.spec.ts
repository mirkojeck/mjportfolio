import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const site = parse(readFileSync('src/data/site.yml', 'utf8'));
const normalizeBaseUrl = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:4321';
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
};
const siteBaseUrl = normalizeBaseUrl(site.brand.domain || site.seo.canonicalBaseUrl);

const routes = [
  '/',
  '/home-1.html',
  '/portfolio-1.html',
  '/services.html',
  '/blog.html',
  '/contact.html',
  '/project-1.html',
  '/mj-admin/',
  '/portfolio/',
  '/portfolio/grid/',
  '/portfolio/wide/',
  '/portfolio/slider/',
  '/projects/interior-design-studio/',
  '/projects/skincare-brand/',
  '/projects/cascade-of-lava/',
  '/projects/air-purifier/',
  '/projects/chocolate-brand/',
  '/services/',
  '/services/brand-strategy/',
  '/team/',
  '/gallery/',
  '/gallery/creative-portfolio-systems/',
  '/publications/',
  '/publications/editable-portfolio-system/',
  '/blog/',
  '/blog/creative-portfolio-systems/',
  '/contact/',
  '/404.html',
];

for (const route of routes) {
  test(`${route} loads`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (!response) {
      throw new Error(`No response returned for ${route}`);
    }
    expect(response?.ok()).toBeTruthy();
    if (route === '/mj-admin/') {
      const html = await response.text();
      expect(html).toContain('decap-cms');
      expect(html).toContain('/mj-admin/preview.js');
      await expect(page).toHaveTitle('Mirko Portfolio Admin');
      return;
    }
    await expect(page.locator('body')).toBeAttached();
  });
}

test('menu opens and closes', async ({ page }) => {
  await page.goto('/');
  const menuButton = page.locator('.mil-menu-btn:visible').first();
  await menuButton.click();
  await expect(page.locator('.mil-menu-frame')).toHaveClass(/mil-active/);
  await menuButton.click();
  await expect(page.locator('.mil-menu-frame')).not.toHaveClass(/mil-active/);
});

test('contact page keeps original form visible', async ({ page }) => {
  await page.goto('/contact.html');
  await expect(page.locator('form.row.align-items-center')).toBeVisible();
  await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
});

test('dynamic contact page keeps editable form visible', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator('form.row.align-items-center')).toBeVisible();
  await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
});

test('/admin route is disabled', async ({ page }) => {
  const response = await page.goto('/admin/');
  expect(response?.status()).toBe(404);
});

test('homepage uses editable site metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(site.seo.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    site.seo.description,
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', site.seo.favicon);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${siteBaseUrl}${site.seo.image}`,
  );
});

test('homepage renders editable home content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Designing a Better World Today/i })).toBeVisible();
  await expect(page.getByText("Welcome to our world of endless imagination and boundless creativity.")).toBeVisible();
  await expect(page.getByRole('heading', { name: /Discover Our Studio/i })).toBeVisible();
  await expect(page.locator('#featured-projects .mil-portfolio-item')).toHaveCount(6);
  await expect(page.locator('.mj-home-gallery .mj-home-gallery__item')).toHaveCount(6);
  await expect(page.locator('.mil-revi-pagination')).toHaveAttribute('data-review-images', /\/img\/faces\/1.jpg/);
  const reviewImages = await page.locator('.mil-revi-pagination').getAttribute('data-review-images');
  expect(JSON.parse(reviewImages || '[]')).toHaveLength(6);
  await expect(page.locator('.mil-team-list .mil-social-icons .fa-behance').first()).toBeVisible();
  await expect(page.locator('.mil-team-list .mil-social-icons .fa-dribbble').first()).toBeVisible();
  await expect(page.locator('a[href="/gallery/#gallery-list"]')).toBeVisible();
});

test('Decap config exposes editable home fields', async ({ page }) => {
  const response = await page.goto('/mj-admin/config.yml');
  expect(response?.ok()).toBeTruthy();
  const config = await page.locator('body').innerText();
  expect(config).toContain('label: Home Page');
  expect(config).toContain('label: Gallery / Case Studies');
  expect(config).not.toContain('media_library:');
  expect(config).toContain(`site_url: ${siteBaseUrl}`);
  expect(config).toContain(`display_url: ${siteBaseUrl}`);
  expect(config).toContain(`base_url: ${siteBaseUrl}`);
  expect(config).toContain('auth_endpoint: api/auth');
  expect(config).toContain('label: Layout Selection');
  expect(config).toContain('name: homeVariant');
  expect(config).toContain('name: portfolioLayout');
  expect(config).toContain('label: Logo Images');
  expect(config).toContain('label: Logo Display');
  expect(config).toContain('label: Customer Photo');
  expect(config).toContain('label: Social Links');
  expect(config).toContain('value: dribbble');
  expect(config).toContain('value: github');
  expect(config).toContain('label_singular: Project');
  expect(config).toContain('description: "Portfolio projects shown on the portfolio page');
  expect(config).toContain('preview_path: "projects/{{slug}}/"');
  expect(config).toContain('preview_path: "services/{{slug}}/"');
  expect(config).toContain('preview_path: "gallery/{{slug}}/"');
  expect(config).toContain('preview_path: "publications/{{slug}}/"');
  expect(config).toContain('name: detailLayout');
  expect(config).toContain('value: project6FullWidthMixedSliders');
  expect(config).toContain('name: process');
  expect(config).not.toContain('preview_path: "blog/{{slug}}/"');
  expect(config).toContain('identifier_field: name');
  expect(config).toContain('view_filters:');
  expect(config).toContain('sortable_fields: [title, date, order]');
  expect(config).toContain('name: light');
  expect(config).toContain('name: dark');
  expect(config).toContain('name: scale');
  expect(config).toContain('name: homeLimit');
  expect(config).toContain('name: useAsCover');
  expect(config).toContain('name: platform');
  expect(config).not.toContain('name: galleryLayout');
  expect(config).not.toContain('name: hoverEffect');
  expect(config).toContain('name: description');
  expect(config).toContain('name: hero');
  expect(config).toContain('name: servicesPreview');
  expect(config).toContain('name: featuredProjects');
  expect(config).toContain('name: teamPreview');
});

test('dynamic portfolio renders editable projects', async ({ page }) => {
  await page.goto('/portfolio/');
  await expect(page.getByRole('heading', { name: 'Interior Design Studio' })).toBeVisible();
  await expect(page.locator('.mil-portfolio-item')).toHaveCount(6);

  await page.goto('/portfolio/slider/');
  await expect(page.locator('.swiper-container.mil-portfolio-slider')).toHaveCount(1);
  await expect(page.locator('.mil-portfolio-nav')).toHaveCount(1);

  await page.goto('/portfolio/wide/');
  await expect(page.locator('.mil-cover-frame.mil-hori')).toHaveCount(6);
});

test('dynamic project detail renders editable project content', async ({ page }) => {
  await page.goto('/projects/interior-design-studio/');
  await expect(page.getByRole('heading', { name: 'Interior Design Studio' })).toBeVisible();
  await expect(page.getByText('Private Studio')).toBeVisible();
  await expect(page.getByText('Brand direction')).toBeVisible();

  await page.goto('/projects/skincare-brand/');
  await expect(page.locator('.swiper-container.mil-1-slider')).toHaveCount(1);

  await page.goto('/projects/cascade-of-lava/');
  await expect(page.locator('.swiper-container.mil-2-slider .mil-image-frame.mil-vertical')).not.toHaveCount(0);

  await page.goto('/projects/air-purifier/');
  await expect(page.locator('.mil-image-frame.mil-fw')).toHaveCount(1);

  await page.goto('/projects/chocolate-brand/');
  await expect(page.locator('.swiper-container.mil-2-slider')).toHaveCount(2);
});

test('dynamic pages preserve animation and media hooks', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.mil-up')).not.toHaveCount(0);
  await expect(page.locator('.swiper-container.mil-reviews-slider')).toHaveCount(1);
  await expect(page.locator('.swiper-container.mil-infinite-show')).toHaveCount(1);
  await expect(page.locator('.mil-scale')).not.toHaveCount(0);
  const pentagonCount = await page.locator('.mil-animation .mil-dodecahedron .mil-pentagon').count();
  expect(pentagonCount).toBeGreaterThanOrEqual(36);
  expect(pentagonCount % 12).toBe(0);

  await page.goto('/portfolio/');
  await expect(page.locator('.mil-portfolio-item.mil-parallax')).not.toHaveCount(0);
  await expect(page.locator('[data-value-1="60"][data-value-2="-60"]')).not.toHaveCount(0);

  await page.goto('/projects/interior-design-studio/');
  await expect(page.locator('[data-fancybox="gallery"]')).not.toHaveCount(0);

  await page.goto('/gallery/creative-portfolio-systems/');
  await expect(page.locator('.swiper-container.mil-2-slider, .swiper-container.mil-1-slider')).toHaveCount(1);
  await expect(page.locator('.swiper-slide')).not.toHaveCount(0);
  await expect(page.locator('[data-fancybox="gallery"]')).not.toHaveCount(0);

  await page.goto('/services/brand-strategy/');
  await expect(page.locator('.mil-accordion-group')).not.toHaveCount(0);
  await expect(page.locator('.mil-accordion-menu')).not.toHaveCount(0);
});

test('dynamic service, team, and blog pages render editable content', async ({ page }) => {
  await page.goto('/services/');
  await expect(page.getByRole('heading', { name: /This is what we do best/i })).toBeVisible();
  await expect(page.getByText('Brand Strategy')).toBeVisible();

  await page.goto('/team/');
  await expect(page.getByRole('heading', { name: 'Mirko' })).toBeVisible();
  await expect(page.locator('.mil-team-card')).toHaveCount(3);

  await page.goto('/gallery/');
  await expect(page.getByText('Building A Portfolio That Stays Editable')).toBeVisible();
  await expect(page.locator('#gallery-list .mj-gallery-card')).not.toHaveCount(0);
  await expect(page.getByText(/images/i).first()).toBeVisible();

  await page.goto('/gallery/creative-portfolio-systems/');
  await expect(page.getByRole('heading', { name: 'Building A Portfolio That Stays Editable' })).toBeVisible();
  await expect(page.getByText(/All galleries/i)).toBeVisible();

  await page.goto('/publications/');
  await expect(page.getByText('Editable Portfolio System')).toBeVisible();

  await page.goto('/publications/editable-portfolio-system/');
  await expect(page.getByRole('heading', { name: 'Editable Portfolio System' })).toBeVisible();
  await expect(page.getByText(/All publications/i)).toBeAttached();
});

test('OAuth Vercel functions are present without committed secrets', async () => {
  const authSource = readFileSync('api/auth.js', 'utf8');
  const callbackSource = readFileSync('api/callback.js', 'utf8');
  const sharedSource = readFileSync('api/_oauth.js', 'utf8');
  expect(authSource).toContain('mj_oauth_state');
  expect(sharedSource).toContain('authorization:github');
  expect(sharedSource).toContain('GITHUB_CLIENT_ID');
  expect(sharedSource).toContain('GITHUB_CLIENT_SECRET');
  expect(`${authSource}\n${callbackSource}\n${sharedSource}`).not.toContain('ghp_');
  expect(`${authSource}\n${callbackSource}\n${sharedSource}`).not.toContain('github_pat_');
});

test('logo controls render editable light and dark logo images', async ({ page }) => {
  const logo = site.brand.logo || {};
  const images = logo.images || {};
  await page.goto('/');
  const frameLogo = page.locator('.mil-frame .mj-logo-mark--frame').first();
  await expect(frameLogo).toHaveAttribute('style', /--mj-logo-height/);

  if (images.light || site.brand.logoLight) {
    await expect(frameLogo.locator('.mj-logo-mark__img--light')).toHaveAttribute('src', images.light || site.brand.logoLight);
  } else {
    await expect(frameLogo).toContainText(site.brand.shortName);
  }

  if (images.dark || site.brand.logoDark) {
    await expect(frameLogo.locator('.mj-logo-mark__img--dark')).toHaveAttribute('src', images.dark || site.brand.logoDark);
  }

  await page.goto('/gallery/');
  const footerLogo = page.locator('footer .mj-logo-mark--footer').first();
  const footerImage = images.footer || site.brand.logoFooter || images.light || site.brand.logoLight || images.dark || site.brand.logoDark || images.fallback || site.brand.logoImage;
  if (footerImage) {
    await expect(footerLogo.locator('img')).toHaveAttribute('src', footerImage);
  } else {
    await expect(footerLogo).toContainText(site.brand.logoText);
  }
});

test('footer social icons are selected from platform values', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer .social-icon .fa-instagram')).toHaveCount(1);
  await expect(page.locator('footer .social-icon .fa-linkedin-in')).toHaveCount(1);
  await expect(page.locator('footer .social-icon .fa-facebook-f')).toHaveCount(1);
  await expect(page.locator('footer .social-icon .fa-behance')).toHaveCount(1);
  await expect(page.locator('footer .social-icon .fa-twitter')).toHaveCount(1);
  await expect(page.locator('footer .social-icon .fa-whatsapp')).toHaveCount(1);
});
