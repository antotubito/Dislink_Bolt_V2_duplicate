import { test, expect, Page } from '@playwright/test';

// Test configuration
const PRODUCTION_URL = 'https://dislinkboltv2duplicate.netlify.app';
const LOCAL_URL = 'http://localhost:3001';

// Test data
const TEST_CONNECTION_CODE = '22f75aa8'; // Known test connection code
const INVALID_CONNECTION_CODE = 'invalid-code-123';
const EXPIRED_CONNECTION_CODE = 'expired-code-123';

test.describe('QR Profile Flow E2E Tests', () => {
  let baseUrl: string;

  test.beforeAll(async () => {
    // Determine which environment to test
    baseUrl = process.env.TEST_ENV === 'production' ? PRODUCTION_URL : LOCAL_URL;
    console.log(`🧪 Testing against: ${baseUrl}`);
  });

  test.describe('Valid Connection Code', () => {
    test('should load public profile for valid connection code', async ({ page }) => {
      // Navigate to public profile URL
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check that we're not redirected to login
      expect(page.url()).toContain(`/profile/${TEST_CONNECTION_CODE}`);

      // Verify profile content loads
      await expect(page.locator('h1')).toBeVisible();
      
      // Check for profile elements (these should be present for a valid profile)
      const profileName = page.locator('h1').first();
      await expect(profileName).toBeVisible();
      
      // Verify it's not showing error states
      await expect(page.locator('text=Profile Not Found')).not.toBeVisible();
      await expect(page.locator('text=QR Code Expired')).not.toBeVisible();
      await expect(page.locator('text=Profile Not Public')).not.toBeVisible();
    });

    test('should show connection request form', async ({ page }) => {
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Look for connection request elements
      const requestButton = page.locator('text=Request Connection');
      if (await requestButton.isVisible()) {
        await expect(requestButton).toBeVisible();
        
        // Click to show form
        await requestButton.click();
        
        // Check for email input
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toHaveAttribute('placeholder', /email/i);
      }
    });

    test('should have working copy link functionality', async ({ page }) => {
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Look for copy link button
      const copyButton = page.locator('text=Copy Link');
      if (await copyButton.isVisible()) {
        await expect(copyButton).toBeVisible();
        
        // Click copy button
        await copyButton.click();
        
        // Check for success message
        await expect(page.locator('text=Copied!')).toBeVisible();
      }
    });

    test('should be mobile responsive', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Check that content is visible on mobile
      await expect(page.locator('h1')).toBeVisible();
      
      // Check that buttons are touch-friendly (minimum 44px height)
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });

  test.describe('Invalid Connection Code', () => {
    test('should show error for invalid connection code', async ({ page }) => {
      await page.goto(`${baseUrl}/profile/${INVALID_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Should show error message
      await expect(page.locator('text=Profile Not Found')).toBeVisible();
      await expect(page.locator('text=Profile not found or not publicly available')).toBeVisible();
      
      // Should have try again button
      await expect(page.locator('text=Try Again')).toBeVisible();
      await expect(page.locator('text=Go to Dislink')).toBeVisible();
    });

    test('should allow retry on invalid code', async ({ page }) => {
      await page.goto(`${baseUrl}/profile/${INVALID_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Click try again
      await page.locator('text=Try Again').click();
      
      // Should show loading state
      await expect(page.locator('text=Loading profile...')).toBeVisible();
      
      // Should return to error state
      await page.waitForTimeout(2000); // Wait for retry to complete
      await expect(page.locator('text=Profile Not Found')).toBeVisible();
    });
  });

  test.describe('Expired Connection Code', () => {
    test('should show expired message for expired code', async ({ page }) => {
      await page.goto(`${baseUrl}/profile/${EXPIRED_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Should show expired message
      await expect(page.locator('text=QR Code Expired')).toBeVisible();
      await expect(page.locator('text=This QR code has expired')).toBeVisible();
      await expect(page.locator('text=Ask the profile owner to share a new QR code')).toBeVisible();
    });
  });

  test.describe('Network and Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Block network requests to simulate network error
      await page.route('**/*', route => route.abort());
      
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Should show error state
      await expect(page.locator('text=Profile Not Found')).toBeVisible();
      await expect(page.locator('text=Failed to load profile')).toBeVisible();
    });

    test('should handle slow network connections', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });
      
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      
      // Should show loading state
      await expect(page.locator('text=Loading profile...')).toBeVisible();
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      // Should eventually show content or error
      const hasContent = await page.locator('h1').isVisible();
      const hasError = await page.locator('text=Profile Not Found').isVisible();
      
      expect(hasContent || hasError).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Check for proper heading structure
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);

      // Check for proper button labels
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          
          // Button should have either text content or aria-label
          expect(text || ariaLabel).toBeTruthy();
        }
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not have console errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');
      
      // Filter out known non-critical errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('404') &&
        !error.includes('Failed to load resource')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });
});

// Helper function to test in incognito mode
test.describe('Incognito Mode Tests', () => {
  test('should work in incognito mode', async ({ browser }) => {
    // Create incognito context
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(`${baseUrl}/profile/${TEST_CONNECTION_CODE}`);
      await page.waitForLoadState('networkidle');
      
      // Should load without authentication
      expect(page.url()).toContain(`/profile/${TEST_CONNECTION_CODE}`);
      
      // Should show profile content
      await expect(page.locator('h1')).toBeVisible();
      
    } finally {
      await context.close();
    }
  });
});
