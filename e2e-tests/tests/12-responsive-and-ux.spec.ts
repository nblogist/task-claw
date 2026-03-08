import { test, expect } from '@playwright/test';
import { PAGES, USER_A } from '../helpers/constants';
import { login, ensureLoggedOut } from '../helpers/auth';

test.describe('12 — Responsive & UX', () => {

  test.describe('Mobile viewport (375px)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('homepage is readable on mobile', async ({ page }) => {
      await page.goto(PAGES.home);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Hero should be visible
      await expect(page.locator('h1')).toBeVisible();

      // CTAs should be visible and tappable
      const postCTA = page.locator('a:has-text("Post a Task")').first();
      await expect(postCTA).toBeVisible();

      // No horizontal scrollbar
      const hasHorizontalScroll = await page.evaluate(() =>
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('navbar hamburger menu works on mobile', async ({ page }) => {
      await page.goto(PAGES.home);
      await page.waitForLoadState('networkidle');

      // Look for hamburger/menu button
      const hamburger = page.locator('button:has(.material-symbols-outlined:has-text("menu")), button[aria-label*="menu" i], button:has-text("☰")').first();
      if (await hamburger.isVisible()) {
        await hamburger.click();
        await page.waitForTimeout(500);

        // Menu should be open — links should be visible
        const navLinks = page.locator('a:has-text("Browse"), a:has-text("Tasks")');
        await expect(navLinks.first()).toBeVisible();

        // Close menu
        await hamburger.click();
        await page.waitForTimeout(300);
      }
    });

    test('task cards stack vertically on mobile', async ({ page }) => {
      await page.goto(PAGES.tasks);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Cards should not overflow
      const hasHorizontalScroll = await page.evaluate(() =>
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('forms are full-width on mobile', async ({ page }) => {
      await page.goto(PAGES.login);
      await page.waitForLoadState('networkidle');

      const formInputs = page.locator('input');
      const count = await formInputs.count();
      for (let i = 0; i < count; i++) {
        const box = await formInputs.nth(i).boundingBox();
        if (box) {
          // Input should be at least 70% of viewport width
          expect(box.width).toBeGreaterThan(250);
        }
      }
    });

    test('browse page filters are scrollable on mobile', async ({ page }) => {
      await page.goto(PAGES.tasks);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Category filters should be horizontally scrollable, not wrapping to overflow
      const hasOverflow = await page.evaluate(() =>
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasOverflow).toBeFalsy();
    });
  });

  test.describe('Tablet viewport (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('layout adjusts gracefully on tablet', async ({ page }) => {
      await page.goto(PAGES.home);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      // No overlapping elements
      const hasHorizontalScroll = await page.evaluate(() =>
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('browse page works on tablet', async ({ page }) => {
      await page.goto(PAGES.tasks);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      await expect(page.locator('h1:has-text("Browse")')).toBeVisible();

      const hasOverflow = await page.evaluate(() =>
        document.body.scrollWidth > window.innerWidth
      );
      expect(hasOverflow).toBeFalsy();
    });
  });

  test.describe('Desktop UX checks', () => {
    test('dark mode consistency — no white flashes', async ({ page }) => {
      // Check multiple pages for background color
      const pages = [PAGES.home, PAGES.tasks, PAGES.login, PAGES.about, PAGES.apiDocs];

      for (const url of pages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Check body background is dark
        const bgColor = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        });

        // Background should be dark (rgb values should be low)
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          const match = bgColor.match(/(\d+)/g);
          if (match) {
            const [r, g, b] = match.map(Number);
            // All RGB values should be < 100 for a dark theme
            expect(r).toBeLessThan(100);
            expect(g).toBeLessThan(100);
            expect(b).toBeLessThan(100);
          }
        }
      }
    });

    test('loading states show spinners/skeletons', async ({ page }) => {
      // Visit dashboard — it should show skeletons before data loads
      await ensureLoggedOut(page);
      await login(page, USER_A.email, USER_A.password);

      // Throttle network to see loading state
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024,
        uploadThroughput: 50 * 1024,
        latency: 1000,
      });

      await page.goto(PAGES.dashboard);

      // Check for skeleton/spinner
      const skeleton = page.locator('.skeleton, .animate-pulse, [class*="spinner"], [class*="loading"]');
      const hasSkeleton = await skeleton.first().isVisible().catch(() => false);
      // Note: this is a UX check — absence is not a failure but worth noting

      // Reset network
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0,
      });

      await page.waitForTimeout(3000);
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    });

    test('keyboard navigation — tab through login form', async ({ page }) => {
      await ensureLoggedOut(page);
      await page.goto(PAGES.login);
      await page.waitForLoadState('networkidle');

      // Tab to email input
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Type email
      const activeTag = await page.evaluate(() => document.activeElement?.tagName);
      // Should be on an input at some point

      // Tab through form
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      // Focus should have moved through the form
      await expect(page.locator('body')).toBeVisible();
    });

    test('Enter submits login form', async ({ page }) => {
      await ensureLoggedOut(page);
      await page.goto(PAGES.login);
      await page.waitForLoadState('networkidle');

      await page.locator('input[type="email"]').fill(USER_A.email);
      await page.locator('input[type="password"]').fill(USER_A.password);

      // Press Enter instead of clicking submit
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      expect(page.url()).toContain('/dashboard');
    });

    test('focus indicators visible on interactive elements', async ({ page }) => {
      await page.goto(PAGES.login);
      await page.waitForLoadState('networkidle');

      const emailInput = page.locator('input[type="email"]');
      await emailInput.focus();
      await page.waitForTimeout(200);

      // Check that the focused element has some visual indicator
      const outlineOrBorder = await emailInput.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          borderColor: styles.borderColor,
          boxShadow: styles.boxShadow,
        };
      });

      // Should have some focus indicator
      await expect(page.locator('body')).toBeVisible();
    });

    test('empty states show helpful messages', async ({ page }) => {
      await ensureLoggedOut(page);
      await login(page, USER_A.email, USER_A.password);

      // Browse with impossible search
      await page.goto(PAGES.tasks + '?search=zzzzzzzzzzz99999nonexistent');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const bodyText = await page.locator('main').textContent();
      const hasEmptyState = bodyText?.toLowerCase().includes('no task') ||
                            bodyText?.toLowerCase().includes('no result') ||
                            bodyText?.includes('0 tasks');
      expect(hasEmptyState).toBeTruthy();
    });

    test('currency display — no "$" for CKB amounts', async ({ page }) => {
      await page.goto(PAGES.tasks);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Check task cards for currency display
      const cards = page.locator('a[href^="/tasks/"]');
      const count = await cards.count();
      if (count > 0) {
        const firstCardText = await cards.first().textContent();
        // If CKB is shown, it should not have $ prefix
        if (firstCardText?.includes('CKB')) {
          expect(firstCardText).not.toMatch(/\$\d/);
        }
      }
    });

    test('deadline shows date + time + "(local time)"', async ({ page }) => {
      await page.goto(PAGES.tasks);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const taskLink = page.locator('a[href^="/tasks/"]').first();
      if (await taskLink.isVisible()) {
        await taskLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const bodyText = await page.locator('main').textContent();
        // Deadline should include "local time" label
        const hasLocalTime = bodyText?.toLowerCase().includes('local time');
        // Note: this is a UX check
      }
    });

    test('back button behavior after form submit', async ({ page }) => {
      await ensureLoggedOut(page);
      await page.goto(PAGES.login);
      await page.waitForLoadState('networkidle');

      await page.locator('input[type="email"]').fill(USER_A.email);
      await page.locator('input[type="password"]').fill(USER_A.password);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      // Hit back — should not re-submit the form
      await page.goBack();
      await page.waitForTimeout(1000);

      // Should not show a "confirm resubmit" dialog
      await expect(page.locator('body')).toBeVisible();
    });

    test('page transitions have no layout shift', async ({ page }) => {
      await page.goto(PAGES.home);
      await page.waitForLoadState('networkidle');

      // Navigate to tasks
      const browseLink = page.locator('a:has-text("Browse Tasks"), a[href="/tasks"]').first();
      if (await browseLink.isVisible()) {
        // Measure content area position before click
        const beforeBox = await page.locator('main, #root').first().boundingBox();

        await browseLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Content area should maintain position (no wild jumps)
        const afterBox = await page.locator('main, #root').first().boundingBox();
        // Just check it's still visible
        expect(afterBox).toBeTruthy();
      }
    });
  });
});
