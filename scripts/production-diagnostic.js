// Production Site Diagnostic Script
// Run this in the browser console on the production site

console.log('🔍 Production Site Diagnostic Starting...');

// Check if React is loaded
console.log('React available:', typeof React !== 'undefined');
console.log('ReactDOM available:', typeof ReactDOM !== 'undefined');

// Check if the root element exists
const rootElement = document.getElementById('root');
console.log('Root element found:', !!rootElement);
console.log('Root element content:', rootElement ? rootElement.innerHTML : 'N/A');

// Check for JavaScript errors
window.addEventListener('error', (event) => {
    console.error('❌ JavaScript Error:', event.error);
    console.error('❌ Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Check for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
});

// Check if assets are loading
const scripts = document.querySelectorAll('script[src]');
console.log('Scripts found:', scripts.length);
scripts.forEach((script, index) => {
    console.log(`Script ${index + 1}:`, script.src);
});

const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
console.log('Stylesheets found:', stylesheets.length);
stylesheets.forEach((sheet, index) => {
    console.log(`Stylesheet ${index + 1}:`, sheet.href);
});

// Test network requests
fetch('/assets/index-Cbhd4Sur.js')
    .then(response => {
        console.log('✅ Main JS file accessible:', response.status);
    })
    .catch(error => {
        console.error('❌ Main JS file failed to load:', error);
    });

fetch('/assets/index-BwFeL7pD.css')
    .then(response => {
        console.log('✅ Main CSS file accessible:', response.status);
    })
    .catch(error => {
        console.error('❌ Main CSS file failed to load:', error);
    });

console.log('🔍 Diagnostic complete. Check console for results.');
