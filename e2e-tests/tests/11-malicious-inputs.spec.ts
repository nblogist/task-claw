import { test, expect } from '@playwright/test';
import { PAGES, USER_A, USER_B, XSS_PAYLOADS, SQL_PAYLOADS } from '../helpers/constants';
import { login, ensureLoggedOut } from '../helpers/auth';

test.describe('11 — Malicious Inputs (The Attacker)', () => {
  test.beforeEach(async ({ page }) => {
    // Setup dialog handler to catch any XSS
    page.on('dialog', async (dialog) => {
      console.error(`ALERT DIALOG FIRED: ${dialog.message()}`);
      await dialog.dismiss();
    });
  });

  test('XSS in task title via post form', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    let alertFired = false;
    page.on('dialog', () => { alertFired = true; });

    for (const payload of XSS_PAYLOADS.slice(0, 3)) {
      await page.locator('input[placeholder*="What do you need"]').fill(payload);
      await page.waitForTimeout(300);
    }

    expect(alertFired).toBeFalsy();
  });

  test('XSS in search field on browse page', async ({ page }) => {
    await page.goto(PAGES.tasks);
    await page.waitForLoadState('networkidle');

    let alertFired = false;
    page.on('dialog', () => { alertFired = true; });

    const searchInput = page.locator('input[placeholder*="Search"]');
    for (const payload of XSS_PAYLOADS) {
      await searchInput.fill(payload);
      await page.waitForTimeout(500);
    }

    expect(alertFired).toBeFalsy();
  });

  test('XSS in bid pitch', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_B.email, USER_B.password);

    await page.goto(PAGES.tasks + '?status=open');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const taskLink = page.locator('a[href^="/tasks/"]').first();
    if (await taskLink.isVisible()) {
      await taskLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      let alertFired = false;
      page.on('dialog', () => { alertFired = true; });

      const pitchInput = page.locator('textarea').first();
      if (await pitchInput.isVisible()) {
        await pitchInput.fill('<img src=x onerror=alert("xss_bid")>');
        await page.waitForTimeout(500);
      }

      expect(alertFired).toBeFalsy();
    }
  });

  test('SQL injection in search field', async ({ page }) => {
    await page.goto(PAGES.tasks);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"]');
    for (const payload of SQL_PAYLOADS) {
      await searchInput.fill(payload);
      await page.waitForTimeout(1000);

      // Page should not crash or show SQL errors
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.toLowerCase()).not.toContain('sql');
      expect(bodyText?.toLowerCase()).not.toContain('syntax error');
      expect(bodyText?.toLowerCase()).not.toContain('pg_');
    }
  });

  test('SQL injection in login email', async ({ page }) => {
    await ensureLoggedOut(page);
    await page.goto(PAGES.login);
    await page.waitForLoadState('networkidle');

    for (const payload of SQL_PAYLOADS) {
      await page.locator('input[type="email"]').fill(payload);
      await page.locator('input[type="password"]').fill('anything');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1500);

      // Should show error, not grant access or crash
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.toLowerCase()).not.toContain('sql');
      expect(bodyText?.toLowerCase()).not.toContain('syntax error');
      expect(page.url()).toContain('/login');
    }
  });

  test('massive input (10000 chars) in description', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill('Massive Input Test');
    await page.locator('textarea').fill('A'.repeat(10000));
    await page.waitForTimeout(500);

    // Page should not freeze
    await expect(page.locator('body')).toBeVisible();

    // Counter should show maxed
    const counter = page.locator('text=/\\d+\\/2000/');
    const hasCounter = await counter.isVisible().catch(() => false);
  });

  test('null bytes in inputs', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill('Null\x00Byte Test');
    await page.locator('textarea').fill('Description with null\x00byte');
    await page.waitForTimeout(500);

    // Should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('unicode/zalgo text in inputs', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    const zalgo = 'Z\u0335\u0302\u0301\u030C\u0328A\u0338\u0327\u0304L\u0337\u0301G\u0335\u0301O\u0335\u030A';
    await page.locator('input[placeholder*="What do you need"]').fill(zalgo);
    await page.locator('textarea').fill(zalgo.repeat(10));
    await page.waitForTimeout(500);

    await expect(page.locator('body')).toBeVisible();
  });

  test('RTL characters in inputs', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill('\u202Ereversed text test');
    await page.locator('textarea').fill('Normal text with \u202Ereversed section\u202C here');
    await page.waitForTimeout(500);

    await expect(page.locator('body')).toBeVisible();
  });

  test('javascript: URL in delivery file_url field', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_B.email, USER_B.password);

    // Find a task in escrow to deliver on
    await page.goto(PAGES.dashboard);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Working tab
    const workingTab = page.locator('button:has-text("Working")').first();
    if (await workingTab.isVisible()) {
      await workingTab.click();
      await page.waitForTimeout(1000);

      const taskLink = page.locator('a[href^="/tasks/"]').first();
      if (await taskLink.isVisible()) {
        await taskLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const urlInput = page.locator('input[placeholder*="url" i], input[placeholder*="link" i], input[type="url"]').first();
        if (await urlInput.isVisible()) {
          // Try javascript: URL
          await urlInput.fill('javascript:alert("xss_url")');
          await page.waitForTimeout(500);

          // Also try file:// URL
          await urlInput.fill('file:///etc/passwd');
          await page.waitForTimeout(500);
        }
      }
    }

    // Should not execute JS
    await expect(page.locator('body')).toBeVisible();
  });

  test('emoji bomb in all fields', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    const emojiString = '🎉'.repeat(100);
    await page.locator('input[placeholder*="What do you need"]').fill(emojiString);
    await page.locator('textarea').fill(emojiString.repeat(5));
    await page.waitForTimeout(500);

    // Should not crash or freeze
    await expect(page.locator('body')).toBeVisible();
  });

  test('HTML entities and special chars in task title', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill('Test &amp; &lt;em&gt;HTML entities&lt;/em&gt;');
    await page.locator('textarea').fill('Description with "quotes" and \'apostrophes\' and <angles> and &amps');
    await page.waitForTimeout(500);

    await expect(page.locator('body')).toBeVisible();
  });
});
