import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const site = parse(readFileSync('src/data/site.yml', 'utf8'));

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
  '/projects/interior-design-studio/',
  '/services/',
  '/services/brand-strategy/',
  '/team/',
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
    `${site.seo.canonicalBaseUrl}${site.seo.image}`,
  );
});

test('homepage renders editable home content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Designing a Better World Today/i })).toBeVisible();
  await expect(page.getByText("Welcome to our world of endless imagination and boundless creativity.")).toBeVisible();
  await expect(page.getByRole('heading', { name: /Discover Our Studio/i })).toBeVisible();
  await expect(page.locator('#featured-projects .mil-portfolio-item')).toHaveCount(6);
});

test('Decap config exposes editable home fields', async ({ page }) => {
  const response = await page.goto('/mj-admin/config.yml');
  expect(response?.ok()).toBeTruthy();
  const config = await page.locator('body').innerText();
  expect(config).toContain('label: Home Page');
  expect(config).toContain('label: Gallery / Case Studies');
  expect(config).toContain('label: Logo Images');
  expect(config).toContain('label: Logo Display');
  expect(config).toContain('name: light');
  expect(config).toContain('name: dark');
  expect(config).toContain('name: scale');
  expect(config).toContain('name: galleryLayout');
  expect(config).toContain('name: hoverEffect');
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
});

test('dynamic project detail renders editable project content', async ({ page }) => {
  await page.goto('/projects/interior-design-studio/');
  await expect(page.getByRole('heading', { name: 'Interior Design Studio' })).toBeVisible();
  await expect(page.getByText('Private Studio')).toBeVisible();
  await expect(page.getByText('Brand direction')).toBeVisible();
});

test('dynamic pages preserve animation and media hooks', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.mil-up')).not.toHaveCount(0);
  await expect(page.locator('.swiper-container.mil-reviews-slider')).toHaveCount(1);
  await expect(page.locator('.swiper-container.mil-infinite-show')).toHaveCount(1);
  await expect(page.locator('.mil-scale')).not.toHaveCount(0);

  await page.goto('/portfolio/');
  await expect(page.locator('.mil-portfolio-item.mil-parallax')).not.toHaveCount(0);
  await expect(page.locator('[data-value-1="60"][data-value-2="-60"]')).not.toHaveCount(0);

  await page.goto('/projects/interior-design-studio/');
  await expect(page.locator('[data-fancybox="gallery"]')).not.toHaveCount(0);

  await page.goto('/blog/creative-portfolio-systems/');
  await expect(page.locator('.swiper-container.mil-2-slider, .swiper-container.mil-1-slider')).toHaveCount(1);
  await expect(page.locator('.swiper-slide')).not.toHaveCount(0);
  await expect(page.locator('[data-fancybox="gallery"]')).not.toHaveCount(0);
});

test('dynamic service, team, and blog pages render editable content', async ({ page }) => {
  await page.goto('/services/');
  await expect(page.getByRole('heading', { name: /This is what we do best/i })).toBeVisible();
  await expect(page.getByText('Brand Strategy')).toBeVisible();

  await page.goto('/team/');
  await expect(page.getByRole('heading', { name: 'Mirko' })).toBeVisible();
  await expect(page.locator('.mil-team-card')).toHaveCount(3);

  await page.goto('/blog/');
  await expect(page.getByText('Building A Portfolio That Stays Editable')).toBeVisible();
  await expect(page.getByText(/images/i).first()).toBeVisible();

  await page.goto('/blog/creative-portfolio-systems/');
  await expect(page.getByRole('heading', { name: 'Building A Portfolio That Stays Editable' })).toBeVisible();
  await expect(page.getByText(/All galleries/i)).toBeVisible();
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

  await page.goto('/blog/');
  const footerLogo = page.locator('footer .mj-logo-mark--footer').first();
  const footerImage = images.footer || site.brand.logoFooter || images.light || site.brand.logoLight || images.dark || site.brand.logoDark || images.fallback || site.brand.logoImage;
  if (footerImage) {
    await expect(footerLogo.locator('img')).toHaveAttribute('src', footerImage);
  } else {
    await expect(footerLogo).toContainText(site.brand.logoText);
  }
});
