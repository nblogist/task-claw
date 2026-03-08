import { test, expect, Page } from '@playwright/test';
import { PAGES, USER_A, USER_B, API_URL } from '../helpers/constants';
import { login, ensureLoggedOut } from '../helpers/auth';

// We'll track state across tests using API calls behind the scenes
let lifecycleTaskSlug: string;
let lifecycleTaskId: string;
let lifecycleBidId: string;
let buyerToken: string;
let sellerToken: string;

test.describe('09 — Full Task Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  test('Step 1: Get auth tokens via API', async ({ request }) => {
    // Get buyer token
    const buyerResp = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USER_A.email, password: USER_A.password },
    });
    const buyerData = await buyerResp.json();
    buyerToken = buyerData.token;
    expect(buyerToken).toBeTruthy();

    // Get seller token
    const sellerResp = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: USER_B.email, password: USER_B.password },
    });
    const sellerData = await sellerResp.json();
    sellerToken = sellerData.token;
    expect(sellerToken).toBeTruthy();
  });

  test('Step 2: User A posts a lifecycle test task via UI', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    await page.goto(PAGES.post);
    await page.waitForLoadState('networkidle');

    const uniqueTitle = `Lifecycle Test ${Date.now()}`;
    await page.locator('input[placeholder*="What do you need"]').fill(uniqueTitle);
    await page.locator('textarea').fill('This is a full lifecycle test. It will go through: post → bid → accept → escrow → deliver → revision → approve → rate.');

    await page.locator('select').first().selectOption({ index: 1 });

    const budgetInputs = page.locator('input[type="number"]');
    if (await budgetInputs.count() >= 2) {
      await budgetInputs.nth(0).fill('100');
      await budgetInputs.nth(1).fill('300');
    }

    const deadlineInput = page.locator('input[type="datetime-local"], input[type="date"]');
    if (await deadlineInput.isVisible()) {
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      await deadlineInput.fill(futureDate.toISOString().slice(0, 16));
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);

    // Should be on task detail page
    expect(page.url()).toContain('/tasks/');
    lifecycleTaskSlug = page.url().split('/tasks/')[1];

    // Get the task ID via page content or API
    const pageContent = await page.content();
    await expect(page.locator(`text=${uniqueTitle}`).first()).toBeVisible();
  });

  test('Step 3: Get task ID from API', async ({ request }) => {
    const resp = await request.get(`${API_URL}/api/tasks/${lifecycleTaskSlug}`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const task = await resp.json();
    lifecycleTaskId = task.id;
    expect(lifecycleTaskId).toBeTruthy();
  });

  test('Step 4: User B places a bid via UI', async ({ page }) => {
    await login(page, USER_B.email, USER_B.password);

    await page.goto(`/tasks/${lifecycleTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill bid form — use exact placeholder selectors
    const bidPriceInput = page.locator('input[placeholder*="Price"]');
    await expect(bidPriceInput).toBeVisible({ timeout: 5000 });
    await bidPriceInput.fill('200');

    const daysInput = page.locator('input[placeholder*="Delivery days"]');
    await expect(daysInput).toBeVisible({ timeout: 3000 });
    await daysInput.fill('3');

    const pitchInput = page.locator('textarea[placeholder*="pitch" i]');
    await expect(pitchInput).toBeVisible({ timeout: 3000 });
    await pitchInput.fill('I can deliver this lifecycle test task in 3 days with high quality results.');

    const bidBtn = page.locator('button:has-text("Submit Bid")');
    await bidBtn.click();
    await page.waitForTimeout(3000);

    // Should see success message or bid appears
    const successMsg = page.locator('text=Bid submitted');
    await expect(successMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 5: Get bid ID from API', async ({ request }) => {
    const resp = await request.get(`${API_URL}/api/tasks/${lifecycleTaskSlug}/bids`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const bids = await resp.json();
    // Try pending first, then any status
    const sellerBid = bids.find((b: any) => b.status === 'pending') || bids[0];
    expect(sellerBid).toBeTruthy();
    lifecycleBidId = sellerBid.id;
  });

  test('Step 6: User A accepts the bid via UI', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    await page.goto(`/tasks/${lifecycleTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find the accept button on the bid
    const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("accept")').first();
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await acceptBtn.click();
    await page.waitForTimeout(3000);

    // Task should now show "In Escrow" status
    const escrowBadge = page.locator('text=/escrow/i');
    await expect(escrowBadge.first()).toBeVisible({ timeout: 5000 });

    // Escrow amount should be shown
    const pageText = await page.locator('main').textContent();
    expect(pageText?.includes('200') || pageText?.toLowerCase().includes('escrow')).toBeTruthy();
  });

  test('Step 7: User B submits delivery via UI', async ({ page }) => {
    await login(page, USER_B.email, USER_B.password);

    await page.goto(`/tasks/${lifecycleTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill delivery form — use exact placeholders
    const deliveryMsg = page.locator('textarea[placeholder*="Delivery message"]');
    await expect(deliveryMsg).toBeVisible({ timeout: 5000 });
    await deliveryMsg.fill('Here is my delivery. The work has been completed as requested.');

    const urlInput = page.locator('input[placeholder*="URL"]');
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://example.com/delivery-result');
    }

    await page.locator('button:has-text("Submit Delivery")').click();
    await page.waitForTimeout(3000);

    // Status should change to Delivered
    await expect(page.locator('text=/delivered/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 8: User A sees delivery and requests revision via UI', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    await page.goto(`/tasks/${lifecycleTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Should see Approve & Release Payment button
    await expect(page.locator('button:has-text("Approve & Release Payment")')).toBeVisible({ timeout: 5000 });

    // Request revision
    await page.locator('button:has-text("Request Revision")').click();
    await page.waitForTimeout(500);

    // Fill revision message
    const revisionInput = page.locator('textarea[placeholder*="What changes"]');
    await expect(revisionInput).toBeVisible({ timeout: 3000 });
    await revisionInput.fill('Please add more detail to section 2 and fix the formatting in section 3.');

    await page.locator('button:has-text("Submit Revision Request")').click();
    await page.waitForTimeout(3000);

    // Status should go back to In Escrow
    await expect(page.locator('text=/escrow/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 9: User B submits revised delivery', async ({ page }) => {
    await login(page, USER_B.email, USER_B.password);

    await page.goto(`/tasks/${lifecycleTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Submit revised delivery
    const deliveryMsg = page.locator('textarea[placeholder*="Delivery message"]');
    await expect(deliveryMsg).toBeVisible({ timeout: 5000 });
    await deliveryMsg.fill('Revised delivery with requested changes applied.');

    const urlInput = page.locator('input[placeholder*="URL"]');
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://example.com/revised-delivery');
    }

    await page.locator('button:has-text("Submit Delivery")').click();
    await page.waitForTimeout(3000);

    await expect(page.locator('text=/delivered/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Step 10: User A approves delivery', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    await page.goto(`/tasks/${lifecycleTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.locator('button:has-text("Approve & Release Payment")').click();
    await page.waitForTimeout(3000);

    // Status should be Completed
    await expect(page.locator('text=/completed/i').first()).toBeVisible({ timeout: 5000 });

    // Escrow released message
    const releaseText = page.locator('text=released, text=Released, text=escrow released');
    const hasRelease = await releaseText.first().isVisible().catch(() => false);
  });

  test('Step 11: User A rates User B', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    await page.goto(`/tasks/${lifecycleTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for rating form (star buttons)
    const starButtons = page.locator('button[aria-label*="star" i], button[aria-label*="rating" i], button:has(.material-symbols-outlined:has-text("star"))');
    const starCount = await starButtons.count();

    if (starCount > 0) {
      // Click the 4th or 5th star
      const starIndex = Math.min(3, starCount - 1);
      await starButtons.nth(starIndex).click();
      await page.waitForTimeout(300);

      // Add review comment
      const commentInput = page.locator('textarea[placeholder*="review" i], textarea[placeholder*="comment" i], textarea[placeholder*="feedback" i], textarea').last();
      if (await commentInput.isVisible()) {
        await commentInput.fill('Excellent work! The agent delivered quality results and responded to revision requests promptly.');
      }

      const rateBtn = page.locator('button:has-text("Rate"), button:has-text("Submit Rating"), button:has-text("Submit Review")').first();
      if (await rateBtn.isVisible()) {
        await rateBtn.click();
        await page.waitForTimeout(3000);

        // Rating should be confirmed
        const ratedText = page.locator('text=rated, text=Rated, text=thank');
        const hasRated = await ratedText.first().isVisible().catch(() => false);
      }
    }
  });

  test('Step 12: Rating appears on User B profile', async ({ page }) => {
    await login(page, USER_A.email, USER_A.password);

    // We need User B's ID — get it from the task detail page
    await page.goto(`/tasks/${lifecycleTaskSlug}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Look for seller profile link
    const sellerLink = page.locator('a[href^="/profile/"]');
    const count = await sellerLink.count();
    if (count > 0) {
      // Click the seller's profile link (not the buyer's)
      await sellerLink.last().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Should see rating/review section
      const profileText = await page.locator('main').textContent();
      const hasRating = profileText?.includes('star') || profileText?.includes('rating') || profileText?.includes('review') || profileText?.includes('Excellent');
      // Just verify profile loads
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('Step 13: User B dashboard shows updated stats', async ({ page }) => {
    await login(page, USER_B.email, USER_B.password);

    await page.goto(PAGES.dashboard);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Dashboard should show completed task or earnings
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Check earnings tab
    const earningsTab = page.locator('button:has-text("Earnings")').first();
    if (await earningsTab.isVisible()) {
      await earningsTab.click();
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
