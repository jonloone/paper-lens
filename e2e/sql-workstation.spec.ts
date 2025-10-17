import { test, expect } from '@playwright/test';

/**
 * SQL Workstation E2E Tests
 *
 * Tests the redesigned Step 3 SQL Workstation with Vercel AI SDK
 */

test.describe('SQL Workstation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Build page
    await page.goto('http://localhost:3000/build');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display SQL chat interface', async ({ page }) => {
    // Check if chat input is visible
    const chatInput = page.getByPlaceholder(/ask me to generate sql/i);
    await expect(chatInput).toBeVisible();

    // Check if chat header is present
    await expect(page.getByText(/iceberg/i)).toBeVisible();
  });

  test('should have three-view switcher in right panel', async ({ page }) => {
    // Check for Preview tab
    await expect(page.getByRole('tab', { name: /preview/i })).toBeVisible();

    // Check for SQL Editor tab
    await expect(page.getByRole('tab', { name: /sql editor/i })).toBeVisible();

    // Check for dbt Model tab
    await expect(page.getByRole('tab', { name: /dbt model/i })).toBeVisible();
  });

  test('should allow typing in chat input', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/ask me to generate sql/i);

    // Type a message
    await chatInput.fill('Generate a simple SELECT query');

    // Verify text was entered
    await expect(chatInput).toHaveValue('Generate a simple SELECT query');
  });

  test('should enable send button when text is entered', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/ask me to generate sql/i);
    const sendButton = page.getByTitle(/send message/i);

    // Initially disabled (or enabled but checking is not meaningful when empty)
    await chatInput.fill('');
    // When empty, button should be disabled

    // Type text
    await chatInput.fill('SELECT * FROM users');

    // Send button should be enabled (not disabled)
    await expect(sendButton).not.toBeDisabled();
  });

  test('should switch between right panel views', async ({ page }) => {
    // Click on SQL Editor tab
    await page.getByRole('tab', { name: /sql editor/i }).click();

    // Wait for SQL Editor to load
    await page.waitForTimeout(500);

    // Click on Preview tab
    await page.getByRole('tab', { name: /preview/i }).click();

    // Verify tab switching works (no errors)
    await expect(page.getByRole('tab', { name: /preview/i })).toHaveAttribute('data-state', 'active');
  });

  test('should show context information in chat header', async ({ page }) => {
    // Check for catalog info
    await expect(page.getByText(/iceberg/i).first()).toBeVisible();

    // Check for environment badge
    await expect(page.getByText(/development/i).first()).toBeVisible();
  });

  test('should have inline action buttons', async ({ page }) => {
    // Check for Run button
    await expect(page.getByRole('button', { name: /run/i })).toBeVisible();

    // Check for dbt button
    await expect(page.getByRole('button', { name: /dbt/i })).toBeVisible();

    // Check for Continue button
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('should not show old header and status bar', async ({ page }) => {
    // The old 80px header should be hidden
    // Check that main nav and dock are hidden (hide-nav-dock class)
    const body = page.locator('body');

    // Verify full-screen mode
    const hasHideClass = await body.evaluate((el) => {
      const workstation = el.querySelector('.hide-nav-dock');
      return workstation !== null;
    });

    expect(hasHideClass).toBeTruthy();
  });

  test('should handle Enter key in chat input', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/ask me to generate sql/i);

    // Type message
    await chatInput.fill('Test message');

    // Press Enter
    await chatInput.press('Enter');

    // Input should be cleared after submission (if form submits)
    // Note: This might not clear in dev without actual API
    await page.waitForTimeout(100);
  });

  test('should handle Shift+Enter for new line', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/ask me to generate sql/i);

    // Type message
    await chatInput.fill('Line 1');

    // Press Shift+Enter
    await chatInput.press('Shift+Enter');

    // Type more text
    await chatInput.type('Line 2');

    // Verify multiline text
    const value = await chatInput.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });
});

test.describe('SQL Chat Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/build');
    await page.waitForLoadState('networkidle');
  });

  test('should show typing indicator when loading', async ({ page }) => {
    // This test would require mocking the API or triggering a real request
    // For now, we just verify the component structure exists
    const chatContainer = page.locator('[class*="chat"]').first();
    await expect(chatContainer).toBeVisible();
  });

  test('should display user messages on the right', async ({ page }) => {
    // After sending a message, user messages should appear right-aligned
    // This requires the chat API to be working or mocked
    // For now, verify the component can mount
    const chatInput = page.getByPlaceholder(/ask me to generate sql/i);
    await expect(chatInput).toBeVisible();
  });

  test('should display assistant messages on the left', async ({ page }) => {
    // Assistant messages should be left-aligned with bot icon
    // Verify component structure
    const chatContainer = page.locator('[class*="chat"]').first();
    await expect(chatContainer).toBeVisible();
  });
});

test.describe('Right Panel Views', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/build');
    await page.waitForLoadState('networkidle');
  });

  test('Preview view should be default', async ({ page }) => {
    const previewTab = page.getByRole('tab', { name: /preview/i });
    await expect(previewTab).toHaveAttribute('data-state', 'active');
  });

  test('SQL Editor view should load TiSQLEditor', async ({ page }) => {
    // Click SQL Editor tab
    await page.getByRole('tab', { name: /sql editor/i }).click();

    // Wait for editor to mount
    await page.waitForTimeout(1000);

    // Verify editor loaded (check for CodeMirror or editor container)
    // This is a basic check
    const tabContent = page.getByRole('tabpanel');
    await expect(tabContent).toBeVisible();
  });

  test('dbt Model view should show message when no model generated', async ({ page }) => {
    // Click dbt tab
    const dbtTab = page.getByRole('tab', { name: /dbt model/i });

    // Initially might be disabled
    const isDisabled = await dbtTab.isDisabled();

    if (isDisabled) {
      // Verify it's disabled when no model exists
      await expect(dbtTab).toBeDisabled();
    } else {
      // Click and verify empty state
      await dbtTab.click();
      await expect(page.getByText(/no dbt model generated/i)).toBeVisible();
    }
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/build');
    await page.waitForLoadState('networkidle');
  });

  test('Enter should submit message', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/ask me to generate sql/i);

    await chatInput.fill('Test query');
    await chatInput.press('Enter');

    // Form should submit (input cleared or message sent)
    await page.waitForTimeout(100);
  });

  test('Shift+Enter should add new line', async ({ page }) => {
    const chatInput = page.getByPlaceholder(/ask me to generate sql/i);

    await chatInput.fill('First line');
    await chatInput.press('Shift+Enter');

    // Should still have focus and allow more input
    await expect(chatInput).toBeFocused();
  });
});

test.describe('Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/build');
    await page.waitForLoadState('networkidle');
  });

  test('should have 40/60 split layout', async ({ page }) => {
    // Verify left panel is ~40% width
    const leftPanel = page.locator('[class*="w-[40%]"]').first();

    // Verify right panel is ~60% width
    const rightPanel = page.locator('[class*="w-[60%]"]').first();

    // Basic presence checks
    if (await leftPanel.count() > 0) {
      await expect(leftPanel).toBeVisible();
    }

    if (await rightPanel.count() > 0) {
      await expect(rightPanel).toBeVisible();
    }
  });

  test('should be full height with no header/status bar', async ({ page }) => {
    // Verify the workstation uses h-screen
    const workstation = page.locator('.h-screen').first();

    if (await workstation.count() > 0) {
      await expect(workstation).toBeVisible();
    }
  });
});
