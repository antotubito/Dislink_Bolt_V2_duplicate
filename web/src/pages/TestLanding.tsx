import React from 'react';

export function TestLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🧪 Test Landing Page</h1>
        <p className="text-xl mb-8">This is a simple test to verify React is working</p>
        <div className="space-y-4">
          <p>✅ React is rendering</p>
          <p>✅ Components are working</p>
          <p>✅ Styling is applied</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Go to Real Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}
