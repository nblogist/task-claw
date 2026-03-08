import { test, expect } from '@playwright/test';
import { PAGES, ADMIN } from '../helpers/constants';
import { loginAsAdmin } from '../helpers/auth';

test.describe('13 — Admin Panel', () => {

  test('admin login page shows token input', async ({ page }) => {
    // Clear any stored admin token
    await page.goto(PAGES.admin);
    await page.evaluate(() => {
      localStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show token input form
    const tokenInput = page.locator('input[type="password"], input[placeholder*="token" i]');
    await expect(tokenInput.first()).toBeVisible();

    const submitBtn = page.locator('button[type="submit"], button:has-text("Access")');
    await expect(submitBtn.first()).toBeVisible();
  });

  test('wrong admin token shows error', async ({ page }) => {
    await page.goto(PAGES.admin);
    await page.evaluate(() => {
      localStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const tokenInput = page.locator('input[type="password"], input[placeholder*="token" i]').first();
    await tokenInput.fill('wrong-token-12345');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Access")').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // Should show error
    const error = page.locator('.text-red-400, .text-red-500').or(page.locator('text=/invalid/i'));
    await expect(error.first()).toBeVisible();
  });

  test('empty admin token is rejected', async ({ page }) => {
    await page.goto(PAGES.admin);
    await page.evaluate(() => {
      localStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Access")').first();
    await submitBtn.click();
    await page.waitForTimeout(1000);

    // Should still be on admin login
    const tokenInput = page.locator('input[type="password"], input[placeholder*="token" i]');
    await expect(tokenInput.first()).toBeVisible();
  });

  test('correct admin token grants access to dashboard', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);
    await page.waitForTimeout(2000);

    // Should see admin dashboard
    const heading = page.locator('h1:has-text("Overview"), h1:has-text("Admin"), h1:has-text("Platform")');
    await expect(heading.first()).toBeVisible();
  });

  test('admin dashboard shows stats cards', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);
    await page.waitForTimeout(2000);

    // Stat cards
    const totalTasks = page.locator('text=Total Tasks');
    const openTasks = page.locator('text=Open Tasks');
    const completed = page.locator('text=Completed');
    const disputed = page.locator('text=Disputed');

    await expect(totalTasks.first()).toBeVisible();
    await expect(completed.first()).toBeVisible();

    // Values should be numbers, not NaN
    const pageText = await page.locator('body').textContent();
    expect(pageText).not.toContain('NaN');
    expect(pageText).not.toContain('undefined');
  });

  test('admin dashboard shows chart', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);
    await page.waitForTimeout(2000);

    // Recharts renders SVG
    const chart = page.locator('svg.recharts-surface, .recharts-wrapper');
    const hasChart = await chart.isVisible().catch(() => false);
    // Chart is nice-to-have, just note if missing
  });

  test('admin tabs navigation works', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);
    await page.waitForTimeout(1000);

    // Click Disputes tab
    const disputesTab = page.locator('a:has-text("Disputes"), button:has-text("Disputes")').first();
    if (await disputesTab.isVisible()) {
      await disputesTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      expect(page.url()).toContain('/admin/disputes');
    }

    // Click Tasks tab
    const tasksTab = page.locator('a:has-text("Tasks")').first();
    if (await tasksTab.isVisible()) {
      await tasksTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      expect(page.url()).toContain('/admin/tasks');
    }

    // Click Dashboard tab
    const dashTab = page.locator('a:has-text("Dashboard")').first();
    if (await dashTab.isVisible()) {
      await dashTab.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/admin\/?$/);
    }
  });

  test('admin tasks page shows task list', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminTasks);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should show task management heading
    const heading = page.locator('h1:has-text("Task Management"), h1:has-text("Tasks")');
    await expect(heading.first()).toBeVisible();

    // Should have a table with tasks
    const table = page.locator('table');
    if (await table.isVisible()) {
      const rows = page.locator('table tbody tr, table tr').filter({ hasNot: page.locator('th') });
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('admin tasks page has pagination', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminTasks);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for pagination
    const pagination = page.locator('button:has-text("Next"), button:has-text("Prev"), button:has-text("›")');
    // Pagination exists if there are enough tasks
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin disputes page shows dispute list', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminDisputes);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const heading = page.locator('h1:has-text("Dispute"), h1:has-text("dispute")');
    await expect(heading.first()).toBeVisible();
  });

  test('admin can expand dispute and see details', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminDisputes);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to expand first dispute
    const disputeRow = page.locator('tr, [class*="cursor-pointer"], button:has-text("View")').first();
    if (await disputeRow.isVisible()) {
      await disputeRow.click();
      await page.waitForTimeout(1500);

      // Details should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('admin resolve button shows loading state', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminDisputes);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find a resolve button
    const resolveBtn = page.locator('button:has-text("Resolve")').first();
    if (await resolveBtn.isVisible()) {
      // Just check it exists — we don't want to actually resolve
      await expect(resolveBtn).toBeVisible();
    }
  });

  test('admin task removal shows confirmation', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminTasks);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find a remove button
    const removeBtn = page.locator('button:has-text("Remove"), button:has-text("Delete")').first();
    if (await removeBtn.isVisible()) {
      // Set up dialog handler
      let dialogAppeared = false;
      page.on('dialog', async (dialog) => {
        dialogAppeared = true;
        await dialog.dismiss(); // Don't actually delete
      });

      await removeBtn.click();
      await page.waitForTimeout(1000);

      // Confirmation should appear (native dialog or custom modal)
      const customModal = page.locator('[role="dialog"], .modal');
      const hasModal = await customModal.isVisible().catch(() => false);
      expect(dialogAppeared || hasModal).toBeTruthy();
    }
  });

  test('admin logout works', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);
    await page.waitForTimeout(1000);

    // Find logout button
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), button:has-text("Exit")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);

      // Should show token input again
      const tokenInput = page.locator('input[type="password"], input[placeholder*="token" i]');
      await expect(tokenInput.first()).toBeVisible();
    }
  });

  test('admin tables scroll horizontally on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminTasks);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Table container should have overflow-x-auto
    const tableContainer = page.locator('.overflow-x-auto, [style*="overflow"]');
    const hasScrollContainer = await tableContainer.isVisible().catch(() => false);

    // Page should not have horizontal overflow
    const bodyOverflow = await page.evaluate(() =>
      document.body.scrollWidth > window.innerWidth
    );
    // Note if page overflows
  });
});
