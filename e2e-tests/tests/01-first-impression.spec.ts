import { test, expect } from '@playwright/test';
import { PAGES } from '../helpers/constants';

test.describe('01 — First Impression (Confused First-Timer)', () => {
  test('homepage loads and shows purpose within 5 seconds', async ({ page }) => {
    await page.goto(PAGES.home);
    // Should see the main heading explaining what the site is
    const hero = page.locator('h1');
    await expect(hero).toBeVisible({ timeout: 5000 });
    const text = await hero.textContent();
    expect(text?.toLowerCase()).toContain('task');
  });

  test('hero CTAs are visible and clickable', async ({ page }) => {
    await page.goto(PAGES.home);
    await page.waitForLoadState('networkidle');

    const postTaskCTA = page.locator('a:has-text("Post a Task")').first();
    const agentApiCTA = page.locator('a:has-text("Agent API")').first();

    await expect(postTaskCTA).toBeVisible();
    await expect(agentApiCTA).toBeVisible();

    // Click Post a Task — should navigate to /post or /login
    await postTaskCTA.click();
    await page.waitForLoadState('networkidle');
    const url1 = page.url();
    expect(url1.includes('/post') || url1.includes('/login')).toBeTruthy();

    // Go back and click Agent API
    await page.goto(PAGES.home);
    await page.waitForLoadState('networkidle');
    await page.locator('a:has-text("Agent API")').first().click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/api-docs');
  });

  test('stats section shows real numbers, not NaN or empty', async ({ page }) => {
    await page.goto(PAGES.home);
    await page.waitForLoadState('networkidle');

    // Wait for stats to load
    await page.waitForTimeout(2000);

    const statValues = page.locator('p.text-white.text-4xl');
    const count = await statValues.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await statValues.nth(i).textContent();
      expect(text).not.toContain('NaN');
      expect(text).not.toBe('');
      expect(text).not.toBeNull();
    }
  });

  test('navbar links all work', async ({ page }) => {
    await page.goto(PAGES.home);
    await page.waitForLoadState('networkidle');

    // Check nav links exist
    const browseLink = page.locator('nav a:has-text("Browse"), header a:has-text("Browse"), a:has-text("Browse Tasks")').first();
    if (await browseLink.isVisible()) {
      await browseLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/tasks');
      await page.goBack();
    }
  });

  test('logo is visible', async ({ page }) => {
    await page.goto(PAGES.home);
    await page.waitForLoadState('networkidle');

    // Logo should be in the header
    const logo = page.locator('header a').first();
    await expect(logo).toBeVisible();
  });

  test('full page scroll — no broken layouts', async ({ page }) => {
    await page.goto(PAGES.home);
    await page.waitForLoadState('networkidle');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Footer should be visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('footer links work', async ({ page }) => {
    await page.goto(PAGES.home);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footerLinks = page.locator('footer a[href^="/"]');
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);

    // Test each footer link
    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      if (href) {
        const response = await page.request.get(`http://localhost:5173${href}`);
        expect(response.status()).toBeLessThan(500);
      }
    }
  });

  test('task cards on homepage are clickable', async ({ page }) => {
    await page.goto(PAGES.home);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const taskCards = page.locator('a[href^="/tasks/"]');
    const count = await taskCards.count();
    if (count > 0) {
      await taskCards.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/tasks/');
    }
  });

  test('/api-docs page loads', async ({ page }) => {
    await page.goto(PAGES.apiDocs);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('/about page loads', async ({ page }) => {
    await page.goto(PAGES.about);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    // Should not be a blank page
    const bodyText = await page.locator('main').textContent();
    expect(bodyText!.length).toBeGreaterThan(10);
  });
});
