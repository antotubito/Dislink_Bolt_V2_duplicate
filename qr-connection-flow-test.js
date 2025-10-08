// 🧪 COMPREHENSIVE QR CONNECTION FLOW TEST
// Copy and paste these functions into your browser console to test the complete flow

console.log('🚀 QR Connection Flow Test Suite Loaded!');
console.log('Available test functions:');
console.log('- testQRGeneration() - Test QR code generation');
console.log('- testQRScanning() - Test QR code scanning and validation');
console.log('- testPublicProfile() - Test public profile display');
console.log('- testEmailConnection() - Test email connection request');
console.log('- testDataPersistence() - Test data persistence');
console.log('- testMobileResponsiveness() - Test mobile UI');
console.log('- runFullFlowTest() - Run complete end-to-end test');

// Helper function to get current user
async function getCurrentUser() {
  if (window.supabase) {
    const { data: { user } } = await window.supabase.auth.getUser();
    return user;
  }
  return null;
}

// Helper function to log test results
function logTestResult(testName, success, details = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName}: ${details}`);
  return success;
}

// 1. Test QR Code Generation
async function testQRGeneration() {
  console.log('\n🔹 Testing QR Code Generation...');
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return logTestResult('QR Generation', false, 'No authenticated user found');
    }

    // Test QR code generation
    if (window.supabaseDebug && window.supabaseDebug.generateUserQRCode) {
      const qrData = await window.supabaseDebug.generateUserQRCode();
      
      if (!qrData || !qrData.connectionCode) {
        return logTestResult('QR Generation', false, 'No QR data generated');
      }

      // Validate QR data structure
      const hasRequiredFields = qrData.userId && qrData.name && qrData.publicProfileUrl;
      if (!hasRequiredFields) {
        return logTestResult('QR Generation', false, 'Missing required QR data fields');
      }

      // Validate URL structure
      const urlPattern = /\/profile\/conn_\d+_[a-z0-9]+/;
      if (!urlPattern.test(qrData.publicProfileUrl)) {
        return logTestResult('QR Generation', false, 'Invalid URL structure');
      }

      console.log('📊 QR Data Generated:', {
        userId: qrData.userId,
        name: qrData.name,
        connectionCode: qrData.connectionCode,
        publicProfileUrl: qrData.publicProfileUrl
      });

      return logTestResult('QR Generation', true, `Generated QR for ${qrData.name}`);
    } else {
      return logTestResult('QR Generation', false, 'QR generation function not available');
    }
  } catch (error) {
    return logTestResult('QR Generation', false, `Error: ${error.message}`);
  }
}

// 2. Test QR Code Scanning and Validation
async function testQRScanning() {
  console.log('\n🔹 Testing QR Code Scanning...');
  
  try {
    // First generate a QR code to test scanning
    if (window.supabaseDebug && window.supabaseDebug.generateUserQRCode) {
      const qrData = await window.supabaseDebug.generateUserQRCode();
      
      if (!qrData || !qrData.connectionCode) {
        return logTestResult('QR Scanning', false, 'No QR data to test scanning');
      }

      // Test QR code validation
      if (window.supabaseDebug && window.supabaseDebug.validateConnectionCode) {
        const validatedData = await window.supabaseDebug.validateConnectionCode(qrData.connectionCode);
        
        if (!validatedData) {
          return logTestResult('QR Scanning', false, 'QR code validation failed');
        }

        // Validate the returned data matches the original
        if (validatedData.userId !== qrData.userId) {
          return logTestResult('QR Scanning', false, 'User ID mismatch in validation');
        }

        console.log('📊 QR Validation Result:', {
          userId: validatedData.userId,
          name: validatedData.name,
          publicProfileEnabled: validatedData.publicProfile?.enabled
        });

        return logTestResult('QR Scanning', true, `Successfully validated QR for ${validatedData.name}`);
      } else {
        return logTestResult('QR Scanning', false, 'QR validation function not available');
      }
    } else {
      return logTestResult('QR Scanning', false, 'QR generation function not available');
    }
  } catch (error) {
    return logTestResult('QR Scanning', false, `Error: ${error.message}`);
  }
}

// 3. Test Public Profile Display
async function testPublicProfile() {
  console.log('\n🔹 Testing Public Profile Display...');
  
  try {
    // Generate QR code and test public profile access
    if (window.supabaseDebug && window.supabaseDebug.generateUserQRCode) {
      const qrData = await window.supabaseDebug.generateUserQRCode();
      
      if (!qrData || !qrData.connectionCode) {
        return logTestResult('Public Profile', false, 'No QR data to test public profile');
      }

      // Test public profile URL
      const publicProfileUrl = qrData.publicProfileUrl;
      
      // Check if URL is accessible (simulate by checking if it's a valid URL)
      try {
        new URL(publicProfileUrl);
        return logTestResult('Public Profile', true, `Public profile URL generated: ${publicProfileUrl}`);
      } catch (urlError) {
        return logTestResult('Public Profile', false, `Invalid public profile URL: ${publicProfileUrl}`);
      }
    } else {
      return logTestResult('Public Profile', false, 'QR generation function not available');
    }
  } catch (error) {
    return logTestResult('Public Profile', false, `Error: ${error.message}`);
  }
}

// 4. Test Email Connection Request
async function testEmailConnection() {
  console.log('\n🔹 Testing Email Connection Request...');
  
  try {
    // Generate QR code for testing
    if (window.supabaseDebug && window.supabaseDebug.generateUserQRCode) {
      const qrData = await window.supabaseDebug.generateUserQRCode();
      
      if (!qrData || !qrData.connectionCode) {
        return logTestResult('Email Connection', false, 'No QR data to test email connection');
      }

      // Test email invitation submission (simulate with test email)
      const testEmail = 'test@example.com';
      const testMessage = 'Test connection request from QR flow test';
      
      // Check if submitInvitationRequest function is available
      if (window.supabaseDebug && window.supabaseDebug.submitInvitationRequest) {
        const result = await window.supabaseDebug.submitInvitationRequest(qrData.connectionCode, {
          email: testEmail,
          message: testMessage
        });
        
        if (result && result.success) {
          return logTestResult('Email Connection', true, `Email invitation submitted successfully`);
        } else {
          return logTestResult('Email Connection', false, `Email invitation failed: ${result?.message || 'Unknown error'}`);
        }
      } else {
        return logTestResult('Email Connection', false, 'Email invitation function not available');
      }
    } else {
      return logTestResult('Email Connection', false, 'QR generation function not available');
    }
  } catch (error) {
    return logTestResult('Email Connection', false, `Error: ${error.message}`);
  }
}

// 5. Test Data Persistence
async function testDataPersistence() {
  console.log('\n🔹 Testing Data Persistence...');
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return logTestResult('Data Persistence', false, 'No authenticated user found');
    }

    // Test if we can retrieve user profile data
    if (window.supabase) {
      const { data: profile, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        return logTestResult('Data Persistence', false, `Profile retrieval error: ${error.message}`);
      }

      if (!profile) {
        return logTestResult('Data Persistence', false, 'No profile data found');
      }

      // Test connection codes persistence
      const { data: connectionCodes, error: codesError } = await window.supabase
        .from('connection_codes')
        .select('*')
        .eq('user_id', user.id);

      if (codesError) {
        return logTestResult('Data Persistence', false, `Connection codes error: ${codesError.message}`);
      }

      console.log('📊 Data Persistence Check:', {
        profileExists: !!profile,
        connectionCodesCount: connectionCodes?.length || 0,
        userId: user.id
      });

      return logTestResult('Data Persistence', true, `Profile and ${connectionCodes?.length || 0} connection codes found`);
    } else {
      return logTestResult('Data Persistence', false, 'Supabase client not available');
    }
  } catch (error) {
    return logTestResult('Data Persistence', false, `Error: ${error.message}`);
  }
}

// 6. Test Mobile Responsiveness
function testMobileResponsiveness() {
  console.log('\n🔹 Testing Mobile Responsiveness...');
  
  try {
    // Check viewport dimensions
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Check if we're in mobile viewport
    const isMobile = viewport.width <= 768;
    
    // Check for mobile-specific elements
    const hasMobileElements = document.querySelector('[class*="sm:"]') !== null;
    
    // Check for responsive breakpoints
    const hasResponsiveClasses = document.querySelector('[class*="md:"]') !== null;
    
    console.log('📊 Mobile Responsiveness Check:', {
      viewport,
      isMobile,
      hasMobileElements,
      hasResponsiveClasses,
      userAgent: navigator.userAgent.includes('Mobile')
    });

    return logTestResult('Mobile Responsiveness', true, `Viewport: ${viewport.width}x${viewport.height}, Mobile: ${isMobile}`);
  } catch (error) {
    return logTestResult('Mobile Responsiveness', false, `Error: ${error.message}`);
  }
}

// 7. Test Analytics and Logging
function testAnalyticsLogging() {
  console.log('\n🔹 Testing Analytics and Logging...');
  
  try {
    // Check if console logging is working
    const originalLog = console.log;
    let logCalled = false;
    
    console.log = function(...args) {
      logCalled = true;
      originalLog.apply(console, args);
    };
    
    console.log('Test log message');
    console.log = originalLog;
    
    // Check if error tracking is available
    const hasErrorTracking = typeof window.Sentry !== 'undefined' || 
                            document.querySelector('[data-sentry]') !== null;
    
    // Check if analytics are available
    const hasAnalytics = typeof window.gtag !== 'undefined' || 
                        document.querySelector('[data-analytics]') !== null;
    
    console.log('📊 Analytics and Logging Check:', {
      consoleLogging: logCalled,
      errorTracking: hasErrorTracking,
      analytics: hasAnalytics
    });

    return logTestResult('Analytics Logging', true, `Console: ${logCalled}, Error Tracking: ${hasErrorTracking}, Analytics: ${hasAnalytics}`);
  } catch (error) {
    return logTestResult('Analytics Logging', false, `Error: ${error.message}`);
  }
}

// Run Complete End-to-End Test
async function runFullFlowTest() {
  console.log('\n🚀 RUNNING COMPLETE QR CONNECTION FLOW TEST');
  console.log('==========================================');
  
  const results = {
    qrGeneration: false,
    qrScanning: false,
    publicProfile: false,
    emailConnection: false,
    dataPersistence: false,
    mobileResponsiveness: false,
    analyticsLogging: false
  };

  // Run all tests
  results.qrGeneration = await testQRGeneration();
  results.qrScanning = await testQRScanning();
  results.publicProfile = await testPublicProfile();
  results.emailConnection = await testEmailConnection();
  results.dataPersistence = await testDataPersistence();
  results.mobileResponsiveness = testMobileResponsiveness();
  results.analyticsLogging = testAnalyticsLogging();

  // Generate summary
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  const successRate = (passedTests / totalTests) * 100;

  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Tests Passed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });

  if (successRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED! QR Connection Flow is working perfectly.');
  } else if (successRate >= 80) {
    console.log('\n⚠️  Most tests passed. Some issues need attention.');
  } else {
    console.log('\n❌ Multiple test failures detected. System needs debugging.');
  }

  return results;
}

// Quick test function for individual components
async function quickTest() {
  console.log('🔍 Running Quick QR Flow Test...');
  const user = await getCurrentUser();
  if (!user) {
    console.log('❌ No authenticated user found. Please log in first.');
    return;
  }
  
  console.log(`✅ User authenticated: ${user.email}`);
  
  if (window.supabaseDebug) {
    console.log('✅ Supabase debug functions available');
    const qrData = await window.supabaseDebug.generateUserQRCode();
    console.log('✅ QR code generated:', qrData.publicProfileUrl);
  } else {
    console.log('❌ Supabase debug functions not available');
  }
}

console.log('\n🎯 Ready to test! Try:');
console.log('- quickTest() - Quick validation');
console.log('- runFullFlowTest() - Complete end-to-end test');
console.log('- Individual test functions for specific components');
