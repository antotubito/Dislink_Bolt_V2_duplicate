/**
 * Accessibility Testing Utilities
 * 
 * This file contains utilities to test and validate accessibility improvements
 * across the Dislink application.
 */

// Color contrast ratio calculation
export function calculateContrastRatio(color1: string, color2: string): number {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    // Calculate relative luminance
    const getLuminance = (r: number, g: number, b: number) => {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
}

// Test color contrast ratios
export function testColorContrast() {
    const tests = [
        { foreground: '#ffffff', background: '#0B1E3D', name: 'White on Cosmic Navy' },
        { foreground: '#f3f4f6', background: '#0B1E3D', name: 'Light Gray on Cosmic Navy' },
        { foreground: '#e5e7eb', background: '#0B1E3D', name: 'Medium Gray on Cosmic Navy' },
        { foreground: '#ffffff', background: '#1F2937', name: 'White on Dark Gray' },
        { foreground: '#A259FF', background: '#ffffff', name: 'Purple on White' },
    ];

    console.log('🎨 Color Contrast Test Results:');
    console.log('================================');

    tests.forEach(test => {
        const ratio = calculateContrastRatio(test.foreground, test.background);
        const wcagAA = ratio >= 4.5 ? '✅ PASS' : '❌ FAIL';
        const wcagAAA = ratio >= 7 ? '✅ PASS' : '❌ FAIL';

        console.log(`${test.name}:`);
        console.log(`  Ratio: ${ratio.toFixed(2)}:1`);
        console.log(`  WCAG AA (4.5:1): ${wcagAA}`);
        console.log(`  WCAG AAA (7:1): ${wcagAAA}`);
        console.log('');
    });
}

// Test touch target sizes
export function testTouchTargets() {
    console.log('👆 Touch Target Test Results:');
    console.log('==============================');

    const elements = document.querySelectorAll('button, [role="button"], input, select, textarea, a');
    let passed = 0;
    let failed = 0;

    elements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const minSize = 44; // WCAG minimum touch target size

        const isLargeEnough = rect.width >= minSize && rect.height >= minSize;

        if (isLargeEnough) {
            passed++;
        } else {
            failed++;
            console.log(`❌ Element ${index + 1}: ${element.tagName} - ${rect.width}x${rect.height}px (needs ${minSize}x${minSize}px minimum)`);
        }
    });

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Total: ${elements.length}`);
}

// Test ARIA labels
export function testARIALabels() {
    console.log('🏷️ ARIA Labels Test Results:');
    console.log('=============================');

    const interactiveElements = document.querySelectorAll('button, [role="button"], input, select, textarea, a[href]');
    let labeled = 0;
    let unlabeled = 0;

    interactiveElements.forEach((element, index) => {
        const hasLabel = element.hasAttribute('aria-label') ||
            element.hasAttribute('aria-labelledby') ||
            element.getAttribute('aria-describedby') ||
            (element.tagName === 'INPUT' && element.getAttribute('placeholder')) ||
            (element.tagName === 'BUTTON' && element.textContent?.trim());

        if (hasLabel) {
            labeled++;
        } else {
            unlabeled++;
            console.log(`❌ Element ${index + 1}: ${element.tagName} - Missing accessible label`);
        }
    });

    console.log(`✅ Properly labeled: ${labeled}`);
    console.log(`❌ Missing labels: ${unlabeled}`);
    console.log(`Total: ${interactiveElements.length}`);
}

// Test focus management
export function testFocusManagement() {
    console.log('⌨️ Focus Management Test Results:');
    console.log('==================================');

    const focusableElements = document.querySelectorAll('button, [role="button"], input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
    let focusable = 0;
    let notFocusable = 0;

    focusableElements.forEach((element, index) => {
        const tabIndex = element.getAttribute('tabindex');
        const isDisabled = element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';

        if (isDisabled) {
            notFocusable++;
            console.log(`⚠️ Element ${index + 1}: ${element.tagName} - Disabled (should not be focusable)`);
        } else if (tabIndex === '-1') {
            notFocusable++;
            console.log(`⚠️ Element ${index + 1}: ${element.tagName} - Tabindex -1 (intentionally not focusable)`);
        } else {
            focusable++;
        }
    });

    console.log(`✅ Focusable elements: ${focusable}`);
    console.log(`⚠️ Non-focusable elements: ${notFocusable}`);
    console.log(`Total: ${focusableElements.length}`);
}

// Test keyboard navigation
export function testKeyboardNavigation() {
    console.log('⌨️ Keyboard Navigation Test:');
    console.log('============================');
    console.log('Press Tab to navigate through focusable elements.');
    console.log('Press Enter or Space to activate buttons.');
    console.log('Press Escape to close modals.');
    console.log('');

    // Add event listeners for keyboard navigation testing
    let currentFocusIndex = 0;
    const focusableElements = Array.from(document.querySelectorAll('button, [role="button"], input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
            (focusableElements[currentFocusIndex] as HTMLElement)?.focus();
        }
    });

    console.log(`Found ${focusableElements.length} focusable elements.`);
}

// Run all accessibility tests
export function runAccessibilityTests() {
    console.log('🔍 Running Comprehensive Accessibility Tests...');
    console.log('===============================================');
    console.log('');

    testColorContrast();
    testTouchTargets();
    testARIALabels();
    testFocusManagement();
    testKeyboardNavigation();

    console.log('');
    console.log('✅ Accessibility tests completed!');
    console.log('Check the results above and fix any issues found.');
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
    (window as any).testAccessibility = runAccessibilityTests;
    (window as any).testColorContrast = testColorContrast;
    (window as any).testTouchTargets = testTouchTargets;
    (window as any).testARIALabels = testARIALabels;
    (window as any).testFocusManagement = testFocusManagement;
    (window as any).testKeyboardNavigation = testKeyboardNavigation;
}
