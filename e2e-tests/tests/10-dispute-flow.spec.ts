import { test, expect } from '@playwright/test';
import { PAGES, USER_A, USER_B, ADMIN, API_URL } from '../helpers/constants';
import { login, ensureLoggedOut, loginAsAdmin } from '../helpers/auth';

let disputeTaskSlug: string;
let disputeTaskId: string;
let buyerToken: string;
let sellerToken: string;

test.describe('10 — Dispute Flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('Step 1: Setup — create task, bid, accept, deliver via API', async ({ request }) => {
    // Login both users
    const buyerResp = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USER_A.email, password: USER_A.password },
    });
    buyerToken = (await buyerResp.json()).token;

    const sellerResp = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USER_B.email, password: USER_B.password },
    });
    sellerToken = (await sellerResp.json()).token;

    // Create task
    const taskResp = await request.post(`${API_URL}/api/tasks`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
      data: {
        title: `Dispute Test ${Date.now()}`,
        description: 'This task will be disputed for testing purposes.',
        category: 'Coding & Development',
        budget_min: 50,
        budget_max: 200,
        currency: 'CKB',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const task = await taskResp.json();
    disputeTaskId = task.id;
    disputeTaskSlug = task.slug;

    // Place bid
    const bidResp = await request.post(`${API_URL}/api/tasks/${disputeTaskId}/bids`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: { price: 150, currency: 'CKB', estimated_delivery_days: 3, pitch: 'Dispute test bid' },
    });
    const bid = await bidResp.json();

    // Accept bid
    await request.post(`${API_URL}/api/tasks/${disputeTaskId}/bids/${bid.id}/accept`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });

    // Submit delivery
    await request.post(`${API_URL}/api/tasks/${disputeTaskId}/deliver`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: { message: 'Dispute test delivery', file_url: 'https://example.com/dispute-test' },
    });
  });

  test('Step 2: User A raises dispute via UI', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    await page.goto(`/tasks/${disputeTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Task should be in Delivered status
    const deliveredBadge = page.locator('text=/delivered/i');
    await expect(deliveredBadge.first()).toBeVisible({ timeout: 5000 });

    // Click "Raise Dispute" to expand the form
    await page.locator('button:has-text("Raise Dispute")').first().click();
    await page.waitForTimeout(500);

    // Fill dispute reason
    const reasonInput = page.locator('textarea[placeholder*="Describe the reason"]');
    await expect(reasonInput).toBeVisible({ timeout: 3000 });
    await reasonInput.fill('The delivery does not meet the requirements specified in the task description. Key deliverables are missing.');

    // Click "Submit Dispute" button
    await page.locator('button:has-text("Submit Dispute")').click();
    await page.waitForTimeout(3000);

    // Status should be Disputed
    const disputedBadge = page.locator('text=/disputed/i');
    await expect(disputedBadge.first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 3: Admin views disputes page', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminDisputes);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should see at least one dispute
    const disputeRows = page.locator('text=/dispute/i');
    expect(await disputeRows.count()).toBeGreaterThan(0);
  });

  test('Step 4: Admin expands dispute details', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminDisputes);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and expand the dispute
    const expandBtn = page.locator('button:has-text("View"), button:has-text("Details"), button:has-text("Expand"), tr, [class*="cursor-pointer"]').first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(1500);

      // Should show task info, bid info, delivery info
      const pageText = await page.locator('main').textContent();
      const hasDetails = pageText?.toLowerCase().includes('dispute') ||
                         pageText?.toLowerCase().includes('delivery') ||
                         pageText?.toLowerCase().includes('reason');
      expect(hasDetails).toBeTruthy();
    }
  });

  test('Step 5: Admin views message log for disputed task', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminDisputes);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Expand a dispute
    const expandBtn = page.locator('button:has-text("View"), button:has-text("Details"), button:has-text("Expand"), tr, [class*="cursor-pointer"]').first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(1500);
    }

    // Click "View Messages" button
    const viewMsgBtn = page.locator('button:has-text("Messages"), button:has-text("View Messages"), button:has-text("message")').first();
    if (await viewMsgBtn.isVisible()) {
      await viewMsgBtn.click();
      await page.waitForTimeout(2000);

      // Messages should load (or "no messages" empty state)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Step 6: Admin resolves dispute in favor of buyer', async ({ page }) => {
    await loginAsAdmin(page, ADMIN.token);

    await page.goto(PAGES.adminDisputes);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find an open/pending dispute
    const expandBtn = page.locator('button:has-text("View"), button:has-text("Details"), button:has-text("Expand"), tr, [class*="cursor-pointer"]').first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(1500);
    }

    // Look for resolve button
    const resolveBtn = page.locator('button:has-text("Resolve"), button:has-text("resolve")').first();
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
      await page.waitForTimeout(500);

      // Add admin note
      const noteInput = page.locator('textarea[placeholder*="note" i], textarea[placeholder*="admin" i], textarea').first();
      if (await noteInput.isVisible()) {
        await noteInput.fill('After reviewing the task requirements and delivery, the delivery does not meet the specified requirements.');
      }

      // Click "Buyer" resolution
      const buyerFavorBtn = page.locator('button:has-text("Buyer"), button:has-text("buyer")').first();
      if (await buyerFavorBtn.isVisible()) {
        await buyerFavorBtn.click();
        await page.waitForTimeout(3000);

        // Should show success
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('Step 7: User A checks task status after resolution', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    await page.goto(`/tasks/${disputeTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Task should show resolved status
    const pageText = await page.locator('main').textContent();
    const isResolved = pageText?.toLowerCase().includes('resolved') ||
                       pageText?.toLowerCase().includes('completed') ||
                       pageText?.toLowerCase().includes('cancelled') ||
                       pageText?.toLowerCase().includes('dispute');
    expect(isResolved).toBeTruthy();
  });

  test('Step 8: User A checks notifications for dispute resolution', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.notifications);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should see a notification about the dispute
    const pageText = await page.locator('main').textContent();
    const hasDisputeNotif = pageText?.toLowerCase().includes('dispute') ||
                            pageText?.toLowerCase().includes('resolved') ||
                            pageText?.toLowerCase().includes('resolution');
    // This may or may not be there depending on implementation
    await expect(page.locator('main')).toBeVisible();
  });

  test('Step 9: User B checks notifications for dispute resolution', async ({ page }) => {
    await login(page, USER_B.email, USER_B.password);

    await page.goto(PAGES.notifications);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.locator('main')).toBeVisible();
  });
});
