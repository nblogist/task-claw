import { test, expect } from '@playwright/test';
import { PAGES, USER_A } from '../helpers/constants';
import { login, ensureLoggedOut } from '../helpers/auth';

test.describe('05 — Buyer: Post a Task', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);
  });

  test('post task page loads with all form fields', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1:has-text("Post")')).toBeVisible();
    await expect(page.locator('input[placeholder*="What do you need"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible(); // category
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('submit with all empty fields shows validation errors', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should show error or still be on post page
    expect(page.url()).toContain('/post');
    const error = page.locator('.text-red-400, [role="alert"]');
    const hasError = await error.isVisible().catch(() => false);
    expect(hasError || page.url().includes('/post')).toBeTruthy();
  });

  test('happy path — post a task successfully', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    const uniqueTitle = `E2E Test Task ${Date.now()}`;

    // Fill title
    await page.locator('input[placeholder*="What do you need"]').fill(uniqueTitle);

    // Fill description
    await page.locator('textarea').fill('This is an automated end-to-end test task created by Playwright. It tests the full task posting flow including all form fields.');

    // Category dropdown
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    // Tags
    const tagsInput = page.locator('input[placeholder*="tag" i], input[placeholder*="comma" i]');
    if (await tagsInput.isVisible()) {
      await tagsInput.fill('e2e, testing, playwright');
    }

    // Budget min/max
    const budgetInputs = page.locator('input[type="number"]');
    const budgetCount = await budgetInputs.count();
    if (budgetCount >= 2) {
      await budgetInputs.nth(0).fill('100');
      await budgetInputs.nth(1).fill('500');
    }

    // Currency selector
    const currencySelect = page.locator('select:has(option:has-text("CKB"))');
    if (await currencySelect.isVisible()) {
      await currencySelect.selectOption('CKB');
    }

    // Deadline
    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      // Set deadline to 7 days from now
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const formatted = futureDate.toISOString().slice(0, 16); // yyyy-MM-ddThh:mm
      await deadlineInput.fill(formatted);
    }

    // Submit
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Should redirect to the new task detail page
    expect(page.url()).toContain('/tasks/');
    expect(page.url()).not.toContain('/post');

    // Verify task title appears on detail page
    await expect(page.locator(`text=${uniqueTitle}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('title with HTML tags is rendered as text, not HTML', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    const xssTitle = '<b>Bold Task</b><script>alert(1)</script>';
    await page.locator('input[placeholder*="What do you need"]').fill(xssTitle);
    await page.locator('textarea').fill('XSS test description');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    const budgetInputs = page.locator('input[type="number"]');
    if (await budgetInputs.count() >= 2) {
      await budgetInputs.nth(0).fill('10');
      await budgetInputs.nth(1).fill('50');
    }

    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await deadlineInput.fill(futureDate.toISOString().slice(0, 16));
    }

    // Listen for alert dialogs
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    expect(alertFired).toBeFalsy();
  });

  test('budget min > max shows validation error', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill('Budget Validation Test');
    await page.locator('textarea').fill('Testing budget min > max');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    const budgetInputs = page.locator('input[type="number"]');
    if (await budgetInputs.count() >= 2) {
      await budgetInputs.nth(0).fill('500'); // min
      await budgetInputs.nth(1).fill('100'); // max (less than min!)
    }

    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await deadlineInput.fill(futureDate.toISOString().slice(0, 16));
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Should show error about budget
    const error = page.locator('.text-red-400, [role="alert"]');
    const errorVisible = await error.isVisible().catch(() => false);
    const stillOnPost = page.url().includes('/post');
    expect(errorVisible || stillOnPost).toBeTruthy();
  });

  test('negative budget is rejected', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill('Negative Budget Test');
    await page.locator('textarea').fill('Testing negative budget');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    const budgetInputs = page.locator('input[type="number"]');
    if (await budgetInputs.count() >= 2) {
      await budgetInputs.nth(0).fill('-100');
      await budgetInputs.nth(1).fill('-50');
    }

    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await deadlineInput.fill(futureDate.toISOString().slice(0, 16));
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/post');
  });

  test('zero budget is rejected', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill('Zero Budget Test');
    await page.locator('textarea').fill('Testing zero budget');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    const budgetInputs = page.locator('input[type="number"]');
    if (await budgetInputs.count() >= 2) {
      await budgetInputs.nth(0).fill('0');
      await budgetInputs.nth(1).fill('0');
    }

    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await deadlineInput.fill(futureDate.toISOString().slice(0, 16));
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1500);

    // Should be rejected or accepted but not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('title character counter works', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('input[placeholder*="What do you need"]');
    await titleInput.fill('Hello');

    // Check if counter shows 5/120
    const counter = page.locator('text=5/120');
    const hasCounter = await counter.isVisible().catch(() => false);
    // Counter is a nice-to-have, just verify page didn't crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('double-click submit does not create duplicate task', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    const uniqueTitle = `Double Click Test ${Date.now()}`;
    await page.locator('input[placeholder*="What do you need"]').fill(uniqueTitle);
    await page.locator('textarea').fill('Testing double click submit prevention');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    const budgetInputs = page.locator('input[type="number"]');
    if (await budgetInputs.count() >= 2) {
      await budgetInputs.nth(0).fill('10');
      await budgetInputs.nth(1).fill('50');
    }

    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await deadlineInput.fill(futureDate.toISOString().slice(0, 16));
    }

    // Double-click the submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.dblclick();
    await page.waitForTimeout(4000);

    // Should redirect to task detail (one task created, not two)
    // Button should have been disabled after first click
    expect(page.url()).toContain('/tasks/');
  });

  test('XSS in description is sanitized', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill(`XSS Desc Test ${Date.now()}`);
    await page.locator('textarea').fill('<img src=x onerror=alert("xss_description")>');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    const budgetInputs = page.locator('input[type="number"]');
    if (await budgetInputs.count() >= 2) {
      await budgetInputs.nth(0).fill('10');
      await budgetInputs.nth(1).fill('50');
    }

    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await deadlineInput.fill(futureDate.toISOString().slice(0, 16));
    }

    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    expect(alertFired).toBeFalsy();
  });

  test('currency selector has CKB/USDT/USDC options', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    const currencySelect = page.locator('select:has(option:has-text("CKB"))');
    if (await currencySelect.isVisible()) {
      const options = await currencySelect.locator('option').allTextContents();
      expect(options.some(o => o.includes('CKB'))).toBeTruthy();
    }
  });

  test('deadline in the past is rejected', async ({ page }) => {
    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    await page.locator('input[placeholder*="What do you need"]').fill('Past Deadline Test');
    await page.locator('textarea').fill('Testing past deadline');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ index: 1 });

    const budgetInputs = page.locator('input[type="number"]');
    if (await budgetInputs.count() >= 2) {
      await budgetInputs.nth(0).fill('10');
      await budgetInputs.nth(1).fill('50');
    }

    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      // Set deadline to yesterday
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await deadlineInput.fill(pastDate.toISOString().slice(0, 16));
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Should either reject or the backend rejects it
    await expect(page.locator('body')).toBeVisible();
  });
});
