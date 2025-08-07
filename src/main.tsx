import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/react-select.css';

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
        <Router>
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
    
  } catch (error) {
    handleCriticalError(error as Error, 'app rendering');
  }
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  
  // Prevent the default behavior that would log to console
  event.preventDefault();
  
  // In production, we might want to send this to an error reporting service
  if (isProduction) {
    // Example: Send to error reporting service
    console.warn('Error reported in production environment');
  }
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('❌ Uncaught error:', event.error);
  
  if (isProduction) {
    // Log but don't crash the application
    console.warn('Uncaught error in production environment');
  }
});