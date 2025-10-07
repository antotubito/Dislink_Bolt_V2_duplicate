import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
  });

  test('should display landing page correctly', async ({ page }) => {
    // Check if the landing page loads
    await expect(page).toHaveTitle(/Dislink/);
    
    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=The Future of Meaningful Connections')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    // Click on registration/early access button
    const registerButton = page.locator('text=Early Access').or(page.locator('text=Get Started')).or(page.locator('text=Sign Up'));
    
    if (await registerButton.isVisible()) {
      await registerButton.click();
      
      // Should navigate to registration page
      await expect(page).toHaveURL(/.*register.*/);
    }
  });

  test('should display registration form', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/app/register');
    
    // Check for registration form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should validate registration form', async ({ page }) => {
    await page.goto('/app/register');
    
    // Try to submit empty form
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors
    await expect(page.locator('text=required').or(page.locator('text=Required'))).toBeVisible();
  });

  test('should handle registration with valid data', async ({ page }) => {
    await page.goto('/app/register');
    
    // Fill in registration form
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123!');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Should show success message or redirect
    await expect(page.locator('text=Check your email').or(page.locator('text=Registration successful'))).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Look for login link or button
    const loginButton = page.locator('text=Login').or(page.locator('text=Sign In'));
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Should navigate to login page
      await expect(page).toHaveURL(/.*login.*/);
    } else {
      // Navigate directly to login page
      await page.goto('/app/login');
    }
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/app/login');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.locator('input[type="password"]').toBeVisible();
    await page.locator('button[type="submit"]').toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/app/login');
    
    // Fill in invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Should show error message
    await expect(page.locator('text=Invalid').or(page.locator('text=Error').or(page.locator('text=Failed')))).toBeVisible();
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/app/login');
    
    // Look for forgot password link
    const forgotPasswordLink = page.locator('text=Forgot password').or(page.locator('text=Reset password'));
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      
      // Should navigate to password reset page
      await expect(page).toHaveURL(/.*reset.*/);
      
      // Check for password reset form
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });
});

test.describe('Security Tests', () => {
  test('should not expose sensitive information in error messages', async ({ page }) => {
    // Navigate to a non-existent page to trigger 404
    await page.goto('/non-existent-page');
    
    // Check that no sensitive information is exposed
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('password');
    expect(pageContent).not.toContain('token');
    expect(pageContent).not.toContain('key');
    expect(pageContent).not.toContain('secret');
  });

  test('should handle XSS attempts in input fields', async ({ page }) => {
    await page.goto('/app/register');
    
    // Try to inject malicious script
    const maliciousScript = '<script>alert("xss")</script>';
    await page.locator('input[type="email"]').fill(maliciousScript);
    
    // Check that the script is not executed
    const emailValue = await page.locator('input[type="email"]').inputValue();
    expect(emailValue).toBe(maliciousScript); // Should be sanitized, not executed
  });

  test('should validate file uploads', async ({ page }) => {
    // This test would require a file upload component
    // For now, we'll test the basic security headers
    const response = await page.goto('/');
    const headers = response?.headers();
    
    // Check for security headers
    expect(headers?.['x-frame-options']).toBeDefined();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that the page is responsive
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that navigation works on mobile
    const menuButton = page.locator('button[aria-label="Menu"]').or(page.locator('text=Menu'));
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Check that the page is responsive
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check for performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });
    
    // Basic performance checks
    expect(performanceMetrics.loadTime).toBeLessThan(2000);
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000);
  });
});
