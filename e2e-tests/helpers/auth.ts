import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitBtn = page.locator('button[type="submit"]');

  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitBtn.click();

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  // Ensure the auth state is settled
  await page.waitForLoadState('networkidle');
}

export async function logout(page: Page) {
  // Try clicking a logout button or user menu
  const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")');
  if (await userMenu.count() > 0) {
    await userMenu.first().click();
    // If it was a dropdown, look for the actual logout option
    const logoutOption = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")');
    if (await logoutOption.count() > 0) {
      await logoutOption.first().click();
    }
  }
}

export async function ensureLoggedOut(page: Page) {
  // Navigate to the app first so we have access to its storage
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function loginAsAdmin(page: Page, token: string) {
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');

  // Check if already logged in (token in localStorage)
  const tokenInput = page.locator('input[placeholder*="Admin token"]');
  if (await tokenInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tokenInput.fill(token);
    await page.locator('button:has-text("Access Admin Panel")').click();
    // Wait for admin panel to load (heading appears)
    await page.waitForTimeout(2000);
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 });
  }
}
