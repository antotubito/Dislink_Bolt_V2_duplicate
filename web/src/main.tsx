import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { AppSimple } from './AppSimple';
import { TestApp } from './TestApp';
import './index.css';
import './utils/emailConfirmationTest'; // Load email confirmation test utilities
import './utils/registrationDiagnostic'; // Load registration diagnostic utilities
import './styles/react-select.css';

// Initialize Sentry as early as possible in the application lifecycle
import { initSentry } from './lib/sentry';
initSentry();

// Initialize logging for production debugging
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

if (!isProduction) {
  console.log('🚀 Starting React app...');
  console.log('📁 Current location:', window.location.href);
  console.log('🔍 Document ready state:', document.readyState);
  console.log('🌍 Environment:', import.meta.env.MODE);
}

// Enhanced error boundary for production
function handleCriticalError(error: Error, context: string) {
  console.error(`❌ Critical error in ${context}:`, error);

  // Send to Sentry
  import('./lib/sentry').then(({ captureError }) => {
    captureError(error, {
      type: 'criticalError',
      context: context,
      timestamp: new Date().toISOString()
    });
  });

  if (isProduction) {
    // In production, show a fallback UI instead of crashing
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          height: 100vh; 
          font-family: system-ui, -apple-system, sans-serif;
          text-align: center;
          padding: 20px;
        ">
          <h1 style="color: #dc2626; margin-bottom: 16px;">Something went wrong</h1>
          <p style="color: #6b7280; margin-bottom: 24px;">
            We're having trouble loading the application. Please try refreshing the page.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              background: #6366f1; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 8px; 
              cursor: pointer;
              font-size: 16px;
            "
          >
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  const error = new Error('Root element not found');
  handleCriticalError(error, 'DOM initialization');
} else {
  if (!isProduction) {
    console.log('✅ Root element found, rendering app...');
  }

  try {
    const root = createRoot(rootElement);

    root.render(
      <StrictMode>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <App />
        </Router>
      </StrictMode>
    );

    if (!isProduction) {
      console.log('✅ App rendered successfully');
    }

    // Initialize Supabase connection with better error handling
    // Use static import to avoid the dynamic import warning
    import('./lib/supabase').then(({ initializeConnection }) => {
      if (!isProduction) {
        console.log('🔗 Initializing Supabase connection...');
      }

      initializeConnection().catch(error => {
        console.error('❌ Supabase initialization failed:', error);
        // Don't crash the app for Supabase errors
      });
    }).catch(error => {
      console.error('❌ Failed to load Supabase module:', error);
      // Don't crash the app for module loading errors
    });

    // Initialize Cosmic Theme System
    import('./lib/cosmicThemes').then(({ cosmicThemeManager }) => {
      if (!isProduction) {
        console.log('🌌 Initializing Cosmic Theme System...');
      }

      // Theme manager automatically loads saved theme and applies it
      const currentTheme = cosmicThemeManager.getCurrentTheme();
      const currentPalette = cosmicThemeManager.getCurrentPalette();

      if (!isProduction) {
        console.log(`✨ Cosmic theme loaded: ${currentPalette.name} - ${currentPalette.description}`);
      }
    }).catch(error => {
      console.error('❌ Failed to load Cosmic Theme System:', error);
      // Don't crash the app for theme loading errors
    });

  } catch (error) {
    handleCriticalError(error as Error, 'app rendering');
  }
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);

  // Prevent the default behavior that would log to console
  event.preventDefault();

  // Send to Sentry
  import('./lib/sentry').then(({ captureError }) => {
    captureError(new Error(`Unhandled promise rejection: ${event.reason}`), {
      type: 'unhandledRejection',
      reason: event.reason,
      promise: event.promise
    });
  });
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('❌ Uncaught error:', event.error);

  // Send to Sentry
  import('./lib/sentry').then(({ captureError }) => {
    captureError(event.error || new Error('Unknown error'), {
      type: 'uncaughtError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
});