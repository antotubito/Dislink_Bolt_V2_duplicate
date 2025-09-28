// Landing Page Diagnostic Script
// Run this in the browser console on both sites to identify the issue

console.log('🔍 Landing Page Diagnostic Starting...');

// Check if React is loaded
console.log('React available:', typeof React !== 'undefined');
console.log('ReactDOM available:', typeof ReactDOM !== 'undefined');

// Check if the root element exists and has content
const rootElement = document.getElementById('root');
console.log('Root element found:', !!rootElement);
console.log('Root element content length:', rootElement ? rootElement.innerHTML.length : 0);
console.log('Root element content preview:', rootElement ? rootElement.innerHTML.substring(0, 200) + '...' : 'N/A');

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

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
});

// Check environment variables
console.log('Environment variables:', {
    MODE: import.meta?.env?.MODE || 'unknown',
    DEV: import.meta?.env?.DEV || 'unknown',
    PROD: import.meta?.env?.PROD || 'unknown',
    VITE_SUPABASE_URL: !!import.meta?.env?.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta?.env?.VITE_SUPABASE_ANON_KEY
});

// Check if main script loaded
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
const mainScript = document.querySelector('script[src*="index-"]');
if (mainScript) {
    fetch(mainScript.src)
        .then(response => {
            console.log('✅ Main JS file accessible:', response.status);
        })
        .catch(error => {
            console.error('❌ Main JS file failed to load:', error);
        });
}

const mainCSS = document.querySelector('link[href*="index-"]');
if (mainCSS) {
    fetch(mainCSS.href)
        .then(response => {
            console.log('✅ Main CSS file accessible:', response.status);
        })
        .catch(error => {
            console.error('❌ Main CSS file failed to load:', error);
        });
}

// Check for Supabase connection
if (typeof window !== 'undefined' && window.supabase) {
    console.log('✅ Supabase client available');
} else {
    console.log('❌ Supabase client not available');
}

// Check for any console errors that might have occurred
console.log('🔍 Diagnostic complete. Check results above.');
console.log('📋 Next steps:');
console.log('1. If React is not available, there might be a JavaScript error');
console.log('2. If root element is empty, React might not be mounting');
console.log('3. If assets are not loading, there might be a network issue');
console.log('4. If Supabase is not available, check environment variables');