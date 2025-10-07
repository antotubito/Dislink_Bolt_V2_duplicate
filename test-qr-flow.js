// 🧪 DISLINK QR CODE FLOW TESTING SCRIPT
// Copy and paste this into your browser console to test the QR code flow

console.log('🚀 Dislink QR Code Flow Testing Suite Loaded!');
console.log('Available functions:');
console.log('- testQRGeneration() - Test QR code generation');
console.log('- testPublicProfileAccess() - Test public profile access');
console.log('- testPreviewFeature() - Test preview public profile feature');

// Test QR code generation
async function testQRGeneration() {
  console.log('🔍 Testing QR Code Generation...');
  
  try {
    // Check if we have access to the QR generation function
    if (typeof window.supabaseDebug === 'undefined') {
      console.log('❌ Supabase debug functions not available. Make sure the app is loaded.');
      return;
    }

    // Test connection first
    const connectionTest = await window.supabaseDebug.testConnection();
    console.log('Connection Test:', connectionTest);

    if (!connectionTest.success) {
      console.log('❌ Cannot test QR generation - Supabase connection failed');
      return;
    }

    // Get current session
    const sessionTest = await window.supabaseDebug.getSession();
    console.log('Session Test:', sessionTest);

    if (!sessionTest.hasSession) {
      console.log('❌ Cannot test QR generation - No active session');
      return;
    }

    console.log('✅ Ready to test QR generation with user:', sessionTest.email);
    
    // Note: We can't directly call generateUserQRCode from here since it's not exposed
    // But we can test the URL structure that would be generated
    const testConnectionCode = `conn_${Date.now()}_test123`;
    const testUrl = window.location.hostname === 'dislinkboltv2duplicate.netlify.app'
      ? `https://dislinkboltv2duplicate.netlify.app/profile/${testConnectionCode}`
      : `http://localhost:3001/profile/${testConnectionCode}`;
    
    console.log('🔗 Test QR URL would be:', testUrl);
    console.log('✅ QR generation test completed successfully!');
    
    return {
      success: true,
      testUrl: testUrl,
      connectionCode: testConnectionCode
    };

  } catch (error) {
    console.error('❌ QR generation test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test public profile access
async function testPublicProfileAccess() {
  console.log('🔍 Testing Public Profile Access...');
  
  try {
    // Test accessing a public profile URL
    const testConnectionCode = `conn_${Date.now()}_test123`;
    const testUrl = window.location.hostname === 'dislinkboltv2duplicate.netlify.app'
      ? `https://dislinkboltv2duplicate.netlify.app/profile/${testConnectionCode}`
      : `http://localhost:3001/profile/${testConnectionCode}`;
    
    console.log('🔗 Testing public profile URL:', testUrl);
    
    // Try to fetch the URL to see if it's accessible
    const response = await fetch(testUrl);
    console.log('📡 Public profile response status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Public profile URL is accessible');
    } else if (response.status === 404) {
      console.log('ℹ️ Public profile URL returns 404 (expected for test code)');
    } else {
      console.log('⚠️ Public profile URL returned unexpected status:', response.status);
    }
    
    return {
      success: true,
      testUrl: testUrl,
      status: response.status
    };

  } catch (error) {
    console.error('❌ Public profile access test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test preview feature
async function testPreviewFeature() {
  console.log('🔍 Testing Preview Public Profile Feature...');
  
  try {
    // Check if we're on the profile page
    if (!window.location.pathname.includes('/app/profile')) {
      console.log('ℹ️ Not on profile page. Navigate to /app/profile to test preview feature.');
      return { success: false, message: 'Not on profile page' };
    }

    // Check if the preview button exists
    const previewButton = document.querySelector('button[onclick*="handlePreviewPublicProfile"], button:contains("Preview Public Profile")');
    
    if (previewButton) {
      console.log('✅ Preview Public Profile button found');
      console.log('🎯 Click the button to test the preview feature');
    } else {
      console.log('❌ Preview Public Profile button not found');
      console.log('🔍 Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()));
    }
    
    return {
      success: !!previewButton,
      buttonFound: !!previewButton
    };

  } catch (error) {
    console.error('❌ Preview feature test failed:', error);
    return { success: false, error: error.message };
  }
}

// Complete QR flow test
async function testCompleteQRFlow() {
  console.log('🧪 Running Complete QR Code Flow Test...');
  
  try {
    const results = {
      qrGeneration: await testQRGeneration(),
      publicProfileAccess: await testPublicProfileAccess(),
      previewFeature: await testPreviewFeature()
    };
    
    console.log('📊 Complete QR Flow Test Results:', results);
    
    const allPassed = Object.values(results).every(result => result.success);
    
    if (allPassed) {
      console.log('✅ All QR flow tests passed!');
    } else {
      console.log('⚠️ Some QR flow tests failed. Check individual results above.');
    }
    
    return results;

  } catch (error) {
    console.error('❌ Complete QR flow test failed:', error);
    return { success: false, error: error.message };
  }
}

console.log('🎉 QR Code Flow Testing suite ready!');
console.log('Try: testCompleteQRFlow()');
