// 🔍 BROWSER DIAGNOSTIC SCRIPT
// Run this in your browser console at http://localhost:3001

console.log('🔍 Starting Browser Diagnostic...');

// Check if React is loaded
console.log('React version:', window.React?.version || 'Not found');
console.log('ReactDOM version:', window.ReactDOM?.version || 'Not found');

// Check if the root element exists
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement ? 'Found' : 'Not found');
if (rootElement) {
    console.log('Root element content:', rootElement.innerHTML);
    console.log('Root element children:', rootElement.children.length);
}

// Check if any React content is rendered
const reactContent = document.querySelector('[data-reactroot], [data-react-helmet]');
console.log('React content found:', reactContent ? 'Yes' : 'No');

// Check for any error messages
const errorElements = document.querySelectorAll('.error, [class*="error"], [class*="Error"]');
console.log('Error elements found:', errorElements.length);

// Check CSS loading
const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
console.log('Stylesheets loaded:', stylesheets.length);
stylesheets.forEach((sheet, index) => {
    console.log(`Stylesheet ${index + 1}:`, sheet.href, sheet.sheet ? 'Loaded' : 'Failed');
});

// Check for JavaScript errors
const originalConsoleError = console.error;
console.error = function (...args) {
    console.log('🚨 JavaScript Error:', ...args);
    originalConsoleError.apply(console, args);
};

// Check if fonts are loaded
if (document.fonts) {
    document.fonts.ready.then(() => {
        console.log('✅ Fonts loaded successfully');
    }).catch((error) => {
        console.log('❌ Font loading error:', error);
    });
}

// Check for any loading indicators
const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], .animate-spin');
console.log('Loading elements found:', loadingElements.length);

// Check if the page is fully loaded
console.log('Document ready state:', document.readyState);
console.log('Page fully loaded:', document.readyState === 'complete');

// Check for any React errors in the console
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    console.log('✅ React internals available');
} else {
    console.log('❌ React internals not available');
}

// Check if Framer Motion is loaded
console.log('Framer Motion available:', typeof window.motion !== 'undefined' ? 'Yes' : 'No');

// Check if Lucide React icons are loaded
console.log('Lucide React available:', typeof window.lucide !== 'undefined' ? 'Yes' : 'No');

// Check for any network errors
const performanceEntries = performance.getEntriesByType('navigation');
if (performanceEntries.length > 0) {
    const navEntry = performanceEntries[0];
    console.log('Page load time:', navEntry.loadEventEnd - navEntry.loadEventStart, 'ms');
    console.log('DOM content loaded:', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'ms');
}

// Check if the landing page content is visible
const visibleElements = document.querySelectorAll('h1, h2, h3, p, button, a');
console.log('Visible content elements:', visibleElements.length);

// Check for any CSS conflicts
const computedStyles = window.getComputedStyle(document.body);
console.log('Body background:', computedStyles.backgroundColor);
console.log('Body color:', computedStyles.color);
console.log('Body font-family:', computedStyles.fontFamily);

// Check if the page is responsive
console.log('Viewport width:', window.innerWidth);
console.log('Viewport height:', window.innerHeight);

// Check for any missing dependencies
const missingDeps = [];
if (!window.React) missingDeps.push('React');
if (!window.ReactDOM) missingDeps.push('ReactDOM');
if (typeof window.motion === 'undefined') missingDeps.push('Framer Motion');
if (typeof window.lucide === 'undefined') missingDeps.push('Lucide React');

if (missingDeps.length > 0) {
    console.log('❌ Missing dependencies:', missingDeps);
} else {
    console.log('✅ All dependencies loaded');
}

// Check for any uncaught errors
window.addEventListener('error', (event) => {
    console.log('🚨 Uncaught Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.log('🚨 Unhandled Promise Rejection:', event.reason);
});

console.log('\n🎯 DIAGNOSTIC COMPLETE!');
console.log('📝 If you see any errors above, those are likely the cause of the loading issue.');
console.log('📝 If no errors are shown, the issue might be with CSS styling or component rendering.');
