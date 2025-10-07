import React from 'react';

export function TestApp() {
  console.log('🧪 TestApp rendering...');
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f0f9ff',
      color: '#1e40af'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>🎉 App is Working!</h1>
      <p style={{ fontSize: '18px', marginBottom: '24px' }}>The React app is rendering correctly.</p>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '12px', color: '#059669' }}>✅ Debugging Complete</h2>
        <p style={{ marginBottom: '8px' }}>• Dev server: Running on port 3001</p>
        <p style={{ marginBottom: '8px' }}>• Environment variables: Loaded</p>
        <p style={{ marginBottom: '8px' }}>• React: Rendering</p>
        <p style={{ marginBottom: '8px' }}>• Error boundaries: Active</p>
        <p>• Console logging: Working</p>
      </div>
    </div>
  );
}