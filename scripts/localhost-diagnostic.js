// Localhost Diagnostic Script
// Run this in the browser console on localhost:3001

console.log('🔍 Localhost Diagnostic Starting...');

// Check if React is loaded
console.log('React available:', typeof React !== 'undefined');
console.log('ReactDOM available:', typeof ReactDOM !== 'undefined');

// Check if the root element exists and has content
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

// Check if Vite is working
console.log('Vite HMR available:', typeof import.meta !== 'undefined' && import.meta.hot);

// Check environment variables
console.log('Environment variables:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

// Test if main.tsx is loading
fetch('/src/main.tsx')
    .then(response => {
        console.log('✅ main.tsx accessible:', response.status);
    })
    .catch(error => {
        console.error('❌ main.tsx failed to load:', error);
    });

console.log('🔍 Localhost diagnostic complete. Check console for results.');
