import { expect, test } from '@playwright/test';

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
  '/404.html',
];

for (const route of routes) {
  test(`${route} loads`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
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

test('/admin route is disabled', async ({ page }) => {
  const response = await page.goto('/admin/');
  expect(response?.status()).toBe(404);
});

test('homepage uses editable site metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Mirko Portfolio | Creative Digital Studio');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'A refined portfolio for creative direction, product design, branding, and digital experiences.',
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/img/icons/zoom.svg');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://mirko-portfolio.vercel.app/img/photo/1.jpg',
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
