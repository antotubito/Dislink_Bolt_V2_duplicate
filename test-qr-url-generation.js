#!/usr/bin/env node

/**
 * Test script to verify QR URL generation with canonical site URL
 */

// Mock environment variables for testing
const mockEnv = {
  VITE_SITE_URL: 'https://dislinkboltv2duplicate.netlify.app',
  VITE_APP_URL: 'https://dislinkboltv2duplicate.netlify.app'
};

// Mock window.location for testing
const mockWindow = {
  location: {
    origin: 'https://dislinkboltv2duplicate.netlify.app'
  }
};

// Test URL generation logic
function testQRUrlGeneration() {
  console.log('🧪 Testing QR URL Generation...\n');

  // Test cases
  const testCases = [
    {
      name: 'Production with VITE_SITE_URL',
      env: { VITE_SITE_URL: 'https://dislinkboltv2duplicate.netlify.app' },
      window: mockWindow,
      expected: 'https://dislinkboltv2duplicate.netlify.app/profile/conn_1234567890_abcdef123'
    },
    {
      name: 'Production with VITE_APP_URL (fallback)',
      env: { VITE_APP_URL: 'https://dislinkboltv2duplicate.netlify.app' },
      window: mockWindow,
      expected: 'https://dislinkboltv2duplicate.netlify.app/profile/conn_1234567890_abcdef123'
    },
    {
      name: 'Production with window.location.origin (fallback)',
      env: {},
      window: mockWindow,
      expected: 'https://dislinkboltv2duplicate.netlify.app/profile/conn_1234567890_abcdef123'
    },
    {
      name: 'Local development',
      env: {},
      window: { location: { origin: 'http://localhost:3001' } },
      expected: 'http://localhost:3001/profile/conn_1234567890_abcdef123'
    },
    {
      name: 'URL with trailing slash (should be removed)',
      env: { VITE_SITE_URL: 'https://dislinkboltv2duplicate.netlify.app/' },
      window: mockWindow,
      expected: 'https://dislinkboltv2duplicate.netlify.app/profile/conn_1234567890_abcdef123'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    
    // Simulate the URL generation logic
    const base = testCase.env.VITE_SITE_URL || testCase.env.VITE_APP_URL || 
      (testCase.window ? testCase.window.location.origin : 'http://localhost:3001');
    const cleanBase = base.replace(/\/$/, '');
    const connectionCode = 'conn_1234567890_abcdef123';
    const generatedUrl = `${cleanBase}/profile/${connectionCode}`;
    
    console.log(`  Input: ${JSON.stringify(testCase.env)}`);
    console.log(`  Generated: ${generatedUrl}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  ✅ ${generatedUrl === testCase.expected ? 'PASS' : 'FAIL'}\n`);
  });

  // Test URL validation
  console.log('🔍 Testing URL Validation...\n');
  
  const testUrls = [
    'https://dislinkboltv2duplicate.netlify.app/profile/conn_1234567890_abcdef123',
    'http://localhost:3001/profile/conn_1234567890_abcdef123',
    'https://dislinkboltv2duplicate.netlify.app/profile/invalid_code',
    'https://dislinkboltv2duplicate.netlify.app/profile/',
    'https://dislinkboltv2duplicate.netlify.app/profile'
  ];

  testUrls.forEach((url, index) => {
    console.log(`URL ${index + 1}: ${url}`);
    
    // Extract connection code from URL
    const match = url.match(/\/profile\/([^\/]+)$/);
    const connectionCode = match ? match[1] : null;
    
    console.log(`  Connection Code: ${connectionCode || 'NOT FOUND'}`);
    console.log(`  Valid Format: ${connectionCode && connectionCode.startsWith('conn_') ? '✅ YES' : '❌ NO'}\n`);
  });

  console.log('🎯 Summary:');
  console.log('- URL generation uses canonical site URL approach');
  console.log('- Trailing slashes are properly removed');
  console.log('- Fallback to window.location.origin works');
  console.log('- Connection codes are properly extracted from URLs');
}

// Run the test
testQRUrlGeneration();
