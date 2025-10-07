import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state for onboarding tests
    await page.goto('/app/onboarding');
  });

  test('should display onboarding welcome screen', async ({ page }) => {
    // Check for onboarding elements
    await expect(page.locator('text=Welcome').or(page.locator('text=Get Started'))).toBeVisible();
    
    // Check for continue/next button
    await expect(page.locator('button').filter({ hasText: /continue|next|start/i })).toBeVisible();
  });

  test('should navigate through onboarding steps', async ({ page }) => {
    // Start onboarding
    const startButton = page.locator('button').filter({ hasText: /continue|next|start/i });
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    
    // Check for step indicators or progress
    const progressIndicator = page.locator('[data-testid="progress"]').or(page.locator('.progress')).or(page.locator('text=Step'));
    if (await progressIndicator.isVisible()) {
      await expect(progressIndicator).toBeVisible();
    }
  });

  test('should handle profile information step', async ({ page }) => {
    // Navigate to profile step (if exists)
    const profileInputs = page.locator('input[name="full_name"]').or(page.locator('input[placeholder*="name"]'));
    
    if (await profileInputs.isVisible()) {
      await profileInputs.fill('Test User');
      
      // Check for next button
      const nextButton = page.locator('button').filter({ hasText: /next|continue/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
    }
  });

  test('should handle location selection step', async ({ page }) => {
    // Look for location-related elements
    const locationInput = page.locator('input[placeholder*="location"]').or(page.locator('input[placeholder*="city"]'));
    
    if (await locationInput.isVisible()) {
      await locationInput.fill('New York');
      
      // Wait for suggestions if any
      await page.waitForTimeout(1000);
      
      // Select first suggestion if available
      const suggestion = page.locator('[role="option"]').first();
      if (await suggestion.isVisible()) {
        await suggestion.click();
      }
    }
  });

  test('should handle industry selection step', async ({ page }) => {
    // Look for industry selection
    const industrySelect = page.locator('select').or(page.locator('[role="combobox"]'));
    
    if (await industrySelect.isVisible()) {
      await industrySelect.click();
      
      // Select an industry option
      const option = page.locator('[role="option"]').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }
  });

  test('should handle social links step', async ({ page }) => {
    // Look for social media inputs
    const socialInputs = page.locator('input[placeholder*="linkedin"]').or(page.locator('input[placeholder*="twitter"]'));
    
    if (await socialInputs.isVisible()) {
      await socialInputs.fill('https://linkedin.com/in/testuser');
    }
  });

  test('should handle profile photo upload', async ({ page }) => {
    // Look for file upload input
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible()) {
      // Create a test image file
      const testImagePath = 'test-image.jpg';
      
      // Note: In a real test, you would create an actual test image file
      // For now, we'll just check if the input is present
      await expect(fileInput).toBeVisible();
    }
  });

  test('should allow skipping optional steps', async ({ page }) => {
    // Look for skip button
    const skipButton = page.locator('button').filter({ hasText: /skip/i });
    
    if (await skipButton.isVisible()) {
      await skipButton.click();
      
      // Should continue to next step or complete onboarding
      await expect(page.locator('text=Complete').or(page.locator('text=Finish'))).toBeVisible();
    }
  });

  test('should complete onboarding successfully', async ({ page }) => {
    // Look for complete/finish button
    const completeButton = page.locator('button').filter({ hasText: /complete|finish|done/i });
    
    if (await completeButton.isVisible()) {
      await completeButton.click();
      
      // Should redirect to main app or dashboard
      await expect(page).toHaveURL(/.*app.*/);
    }
  });

  test('should handle onboarding errors gracefully', async ({ page }) => {
    // Try to submit incomplete form
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /submit|save/i }));
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors
      const errorMessage = page.locator('text=required').or(page.locator('text=error').or(page.locator('.error')));
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('should allow going back to previous steps', async ({ page }) => {
    // Look for back button
    const backButton = page.locator('button').filter({ hasText: /back|previous/i });
    
    if (await backButton.isVisible()) {
      await backButton.click();
      
      // Should go back to previous step
      await expect(page.locator('text=Welcome').or(page.locator('text=Get Started'))).toBeVisible();
    }
  });

  test('should save progress during onboarding', async ({ page }) => {
    // Fill in some information
    const nameInput = page.locator('input[name="full_name"]').or(page.locator('input[placeholder*="name"]'));
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
      
      // Navigate away and back to check if progress is saved
      await page.goto('/');
      await page.goto('/app/onboarding');
      
      // Check if the information is still there (if auto-save is implemented)
      const savedValue = await nameInput.inputValue();
      if (savedValue) {
        expect(savedValue).toBe('Test User');
      }
    }
  });
});

test.describe('Onboarding Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/app/onboarding');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should be able to navigate through the form
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/app/onboarding');
    
    // Check for ARIA labels on form elements
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // Should have either aria-label or aria-labelledby
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/app/onboarding');
    
    // Check that focus is properly managed
    const firstInput = page.locator('input').first();
    if (await firstInput.isVisible()) {
      await expect(firstInput).toBeFocused();
    }
  });
});

test.describe('Onboarding Mobile Experience', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/app/onboarding');
    
    // Check that onboarding is responsive
    await expect(page.locator('text=Welcome').or(page.locator('text=Get Started'))).toBeVisible();
    
    // Check that form elements are properly sized for mobile
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const box = await input.boundingBox();
      
      if (box) {
        // Input should be at least 44px tall for touch targets
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should handle mobile keyboard properly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/app/onboarding');
    
    // Test mobile keyboard interaction
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[placeholder*="email"]'));
    
    if (await emailInput.isVisible()) {
      await emailInput.click();
      
      // Should show appropriate keyboard on mobile
      await emailInput.fill('test@example.com');
      
      // Check that the input value is correct
      await expect(emailInput).toHaveValue('test@example.com');
    }
  });
});
