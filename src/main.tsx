import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import './styles/react-select.css';

console.log('Starting React app...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
} else {
  console.log('Root element found, rendering app immediately...');
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Router>
        <App />
      </Router>
    </StrictMode>
  );
  console.log('App rendered successfully');
  
  // Initialize Supabase connection in background (non-blocking)
  import('./lib/supabase').then(({ initializeConnection }) => {
    console.log('Initializing Supabase connection in background...');
    initializeConnection().catch(error => {
      console.error('Background Supabase connection failed:', error);
    });
  }).catch(error => {
    console.error('Failed to load Supabase module:', error);
  });
}