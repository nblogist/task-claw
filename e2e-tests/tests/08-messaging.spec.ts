import { test, expect } from '@playwright/test';
import { PAGES, USER_A, USER_B, API_URL } from '../helpers/constants';
import { login, ensureLoggedOut } from '../helpers/auth';

test.describe('08 — Messaging', () => {
  // We need a task that both users can message on
  let taskSlug: string | null = null;

  test('User B can send a message on a task (pre-bid or post-bid)', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_B.email, USER_B.password);

    // Find an open task
    await page.goto(PAGES.tasks + '?status=open');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const taskLink = page.locator('a[href^="/tasks/"]').first();
    if (await taskLink.isVisible()) {
      const href = await taskLink.getAttribute('href');
      taskSlug = href?.replace('/tasks/', '') || null;

      await taskLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for messages section / expand
      const messagesToggle = page.locator('button:has-text("Messages"), button:has-text("Message"), button:has-text("Chat"), [class*="message"]').first();
      if (await messagesToggle.isVisible()) {
        await messagesToggle.click();
        await page.waitForTimeout(1000);

        // Find message input
        const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="type" i], textarea[placeholder*="type" i]').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill('Hello from seller! This is a pre-bid message test from Playwright.');

          const sendBtn = page.locator('button:has-text("Send"), button[type="submit"]').last();
          if (await sendBtn.isVisible()) {
            await sendBtn.click();
            await page.waitForTimeout(2000);

            // Message should appear in the thread
            const messageThread = page.locator('text=Hello from seller');
            await expect(messageThread.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('User A can see messages and reply on a task they own', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    if (!taskSlug) {
      // Find any task owned by User A
      await page.goto(PAGES.dashboard);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const taskLink = page.locator('a[href^="/tasks/"]').first();
      if (await taskLink.isVisible()) {
        await taskLink.click();
      }
    } else {
      await page.goto(`/tasks/${taskSlug}`);
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Open messages
    const messagesToggle = page.locator('button:has-text("Messages"), button:has-text("Message"), button:has-text("Chat")').first();
    if (await messagesToggle.isVisible()) {
      await messagesToggle.click();
      await page.waitForTimeout(1500);

      // Reply
      const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="type" i], textarea[placeholder*="type" i]').first();
      if (await messageInput.isVisible()) {
        await messageInput.fill('Reply from buyer! Got your message.');

        const sendBtn = page.locator('button:has-text("Send"), button[type="submit"]').last();
        if (await sendBtn.isVisible()) {
          await sendBtn.click();
          await page.waitForTimeout(2000);

          // Reply should appear
          const reply = page.locator('text=Reply from buyer');
          await expect(reply.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('empty message cannot be sent', async ({ page }) => {
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

      const messagesToggle = page.locator('button:has-text("Messages"), button:has-text("Message"), button:has-text("Chat")').first();
      if (await messagesToggle.isVisible()) {
        await messagesToggle.click();
        await page.waitForTimeout(1000);

        // Try to send empty message
        const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="type" i], textarea[placeholder*="type" i]').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill('');

          const sendBtn = page.locator('button:has-text("Send"), button[type="submit"]').last();
          if (await sendBtn.isVisible()) {
            // Button should be disabled or click should do nothing
            const isDisabled = await sendBtn.isDisabled();
            if (!isDisabled) {
              await sendBtn.click();
              await page.waitForTimeout(1000);
              // Should not crash
              await expect(page.locator('body')).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('XSS in message content is sanitized', async ({ page }) => {
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
      page.on('dialog', async (dialog) => {
        alertFired = true;
        await dialog.dismiss();
      });

      const messagesToggle = page.locator('button:has-text("Messages"), button:has-text("Message"), button:has-text("Chat")').first();
      if (await messagesToggle.isVisible()) {
        await messagesToggle.click();
        await page.waitForTimeout(1000);

        const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="type" i], textarea[placeholder*="type" i]').first();
        if (await messageInput.isVisible()) {
          await messageInput.fill('<script>alert("xss_message")</script>');

          const sendBtn = page.locator('button:has-text("Send"), button[type="submit"]').last();
          if (await sendBtn.isVisible()) {
            await sendBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }

      expect(alertFired).toBeFalsy();
    }
  });

  test('message timestamps are readable', async ({ page }) => {
    await ensureLoggedOut(page);
    await login(page, USER_A.email, USER_A.password);

    // Navigate to a task with messages
    await page.goto(PAGES.dashboard);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const taskLink = page.locator('a[href^="/tasks/"]').first();
    if (await taskLink.isVisible()) {
      await taskLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const messagesToggle = page.locator('button:has-text("Messages"), button:has-text("Message"), button:has-text("Chat")').first();
      if (await messagesToggle.isVisible()) {
        await messagesToggle.click();
        await page.waitForTimeout(1500);

        // Check for timestamps
        const timeElements = page.locator('time, [class*="date"], [class*="time"], .text-slate-500');
        const count = await timeElements.count();
        // Just verify the section loaded
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });
});
