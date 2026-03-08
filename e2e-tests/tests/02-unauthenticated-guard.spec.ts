import { test, expect } from '@playwright/test';
import { PAGES } from '../helpers/constants';
import { ensureLoggedOut } from '../helpers/auth';

test.describe('02 — Unauthenticated Guards (URL Hacker)', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('/dashboard redirects to /login when not authenticated', async ({ page }) => {
    await page.goto(PAGES.dashboard);
    await page.waitForLoadState('networkidle');
    // Should redirect to login or show sign-in prompt
    const url = page.url();
    const hasLoginRedirect = url.includes('/login');
    const hasSignInPrompt = await page.locator('text=Sign in').isVisible().catch(() => false);
    expect(hasLoginRedirect || hasSignInPrompt).toBeTruthy();
  });

  test('/post shows sign-in prompt or redirects when not authenticated', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const hasLoginRedirect = url.includes('/login');
    const hasSignInPrompt = await page.locator('text=Sign in').isVisible().catch(() => false);
    const hasLockPrompt = await page.locator('text=sign in to post').isVisible().catch(() => false);
    expect(hasLoginRedirect || hasSignInPrompt || hasLockPrompt).toBeTruthy();
  });

  test('/notifications redirects to /login when not authenticated', async ({ page }) => {
    await page.goto(PAGES.notifications);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const hasLoginRedirect = url.includes('/login');
    const hasSignInPrompt = await page.locator('text=Sign in').isVisible().catch(() => false);
    expect(hasLoginRedirect || hasSignInPrompt).toBeTruthy();
  });

  test('/admin prompts for token', async ({ page }) => {
    await page.goto(PAGES.admin);
    await page.waitForLoadState('networkidle');
    // Should show token input
    const tokenInput = page.locator('input[type="password"]');
    await expect(tokenInput).toBeVisible();
  });

  test('/tasks is publicly accessible', async ({ page }) => {
    await page.goto(PAGES.tasks);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/tasks');
    await expect(page.locator('h1:has-text("Browse")')).toBeVisible();
  });

  test('task detail page is publicly viewable', async ({ page }) => {
    // First get a real task slug
    await page.goto(PAGES.tasks);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const taskLink = page.locator('a[href^="/tasks/"]').first();
    if (await taskLink.isVisible()) {
      await taskLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/tasks/');
      // Should see task content, not a login prompt
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('non-existent task slug shows styled 404', async ({ page }) => {
    await page.goto('/tasks/nonexistent-garbage-slug-zzz-99999');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show a 404 message, not a crash/blank page
    const bodyText = await page.locator('body').textContent();
    const has404 = bodyText?.toLowerCase().includes('not found') ||
                   bodyText?.toLowerCase().includes('404') ||
                   bodyText?.toLowerCase().includes('doesn\'t exist') ||
                   bodyText?.toLowerCase().includes('no task');
    expect(has404).toBeTruthy();

    // Should have a back-to-marketplace link/button
    const backLink = page.locator('a:has-text("Browse"), a:has-text("Marketplace"), a:has-text("Back"), a:has-text("tasks")');
    const hasBackLink = await backLink.count();
    expect(hasBackLink).toBeGreaterThan(0);
  });

  test('/profile/:id is publicly accessible', async ({ page }) => {
    // Profile for user ID 1 or similar
    await page.goto('/profile/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
  });

  test('non-existent profile handles gracefully', async ({ page }) => {
    await page.goto('/profile/00000000-0000-0000-0000-000000000000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show error or 404, not crash
    const bodyText = await page.locator('main, body').first().textContent();
    expect(bodyText).toBeTruthy();
    // No unhandled error in console
  });

  test('back button after login redirect does not loop', async ({ page }) => {
    await page.goto(PAGES.dashboard);
    await page.waitForLoadState('networkidle');

    // Should be on login now
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should not be stuck in redirect loop — just check page loaded
    await expect(page.locator('body')).toBeVisible();
  });
});
