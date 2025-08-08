/**
 * AUTHENTICATION FLOW TEST SCRIPT
 * 
 * Run this in the browser console to test the complete auth flow
 */

console.log('🧪 Starting Authentication Flow Test...');

// Test configuration
const TEST_CONFIG = {
  baseUrl: window.location.origin,
  testEmail: `test-${Date.now()}@example.com`,
  testPassword: 'TestPassword123!',
  timeout: 30000 // 30 seconds
};

// Test utilities
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testLog = (step, message, data = null) => {
  console.log(`🔍 Test Step ${step}: ${message}`, data || '');
};

const testError = (step, message, error = null) => {
  console.error(`❌ Test Step ${step}: ${message}`, error || '');
};

const testSuccess = (step, message, data = null) => {
  console.log(`✅ Test Step ${step}: ${message}`, data || '');
};

// Test functions
async function testSupabaseConnection() {
  testLog(1, 'Testing Supabase connection...');
  
  try {
    // Check if supabase is available
    if (typeof window.supabase === 'undefined') {
      // Try to access from module
      const supabaseModule = await import('/src/lib/supabase.ts');
      window.testSupabase = supabaseModule.supabase;
    }
    
    const supabase = window.testSupabase || window.supabase;
    
    if (!supabase) {
      testError(1, 'Supabase client not available');
      return false;
    }
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      testError(1, 'Supabase connection error', error);
      return false;
    }
    
    testSuccess(1, 'Supabase connection successful', {
      hasSession: !!data.session,
      sessionUser: data.session?.user?.email
    });
    
    return true;
  } catch (error) {
    testError(1, 'Supabase connection test failed', error);
    return false;
  }
}

async function testRegistrationProcess() {
  testLog(2, 'Testing registration process...');
  
  try {
    // Navigate to registration page
    window.location.href = `${TEST_CONFIG.baseUrl}/app/register`;
    await wait(2000);
    
    // Fill registration form (this would need to be done manually)
    testLog(2, 'Registration form should be visible. Fill it manually with:', {
      email: TEST_CONFIG.testEmail,
      password: TEST_CONFIG.testPassword
    });
    
    return true;
  } catch (error) {
    testError(2, 'Registration test failed', error);
    return false;
  }
}

async function testEmailConfirmation() {
  testLog(3, 'Testing email confirmation...');
  
  try {
    // This step requires manual email checking
    testLog(3, 'Check your email for confirmation link and click it');
    testLog(3, 'The link should redirect to /confirmed');
    
    // Monitor for session changes
    let sessionCheckCount = 0;
    const maxChecks = 30;
    
    const checkSession = async () => {
      sessionCheckCount++;
      
      try {
        const { data: { session } } = await window.testSupabase.auth.getSession();
        
        if (session) {
          testSuccess(3, 'Session established after email confirmation', {
            userId: session.user.id,
            email: session.user.email
          });
          return true;
        } else if (sessionCheckCount >= maxChecks) {
          testError(3, 'Session not established after maximum wait time');
          return false;
        } else {
          testLog(3, `Waiting for session... (${sessionCheckCount}/${maxChecks})`);
          await wait(2000);
          return checkSession();
        }
      } catch (error) {
        testError(3, 'Error checking session', error);
        return false;
      }
    };
    
    return await checkSession();
  } catch (error) {
    testError(3, 'Email confirmation test failed', error);
    return false;
  }
}

async function testOnboardingFlow() {
  testLog(4, 'Testing onboarding flow...');
  
  try {
    // Check if we're on onboarding page
    if (!window.location.pathname.includes('/app/onboarding')) {
      testLog(4, 'Navigating to onboarding page...');
      window.location.href = `${TEST_CONFIG.baseUrl}/app/onboarding`;
      await wait(3000);
    }
    
    // Check if onboarding page loaded
    if (window.location.pathname.includes('/app/onboarding')) {
      testSuccess(4, 'Onboarding page loaded successfully');
      
      // Log current user state from React context
      testLog(4, 'Complete onboarding manually and observe console logs');
      return true;
    } else {
      testError(4, 'Failed to load onboarding page', {
        currentPath: window.location.pathname
      });
      return false;
    }
  } catch (error) {
    testError(4, 'Onboarding flow test failed', error);
    return false;
  }
}

async function testLoginFlow() {
  testLog(5, 'Testing existing user login...');
  
  try {
    // Navigate to login page
    window.location.href = `${TEST_CONFIG.baseUrl}/app/login`;
    await wait(2000);
    
    testLog(5, 'Login form should be visible. Test with existing credentials');
    
    return true;
  } catch (error) {
    testError(5, 'Login flow test failed', error);
    return false;
  }
}

// Main test runner
async function runAuthenticationTests() {
  console.log('🚀 Running Complete Authentication Flow Tests...');
  console.log('📋 Test Configuration:', TEST_CONFIG);
  
  const results = {
    supabaseConnection: false,
    registrationProcess: false,
    emailConfirmation: false,
    onboardingFlow: false,
    loginFlow: false
  };
  
  try {
    // Test 1: Supabase Connection
    results.supabaseConnection = await testSupabaseConnection();
    if (!results.supabaseConnection) {
      console.log('❌ Stopping tests due to Supabase connection failure');
      return results;
    }
    
    // Test 2: Registration Process
    results.registrationProcess = await testRegistrationProcess();
    
    // Test 3: Email Confirmation (manual step)
    console.log('⏸️  Manual Step Required: Check email and click confirmation link');
    
    // Test 4: Onboarding Flow
    // This will be tested after email confirmation
    
    // Test 5: Login Flow
    results.loginFlow = await testLoginFlow();
    
  } catch (error) {
    console.error('❌ Authentication test suite failed:', error);
  }
  
  console.log('📊 Test Results Summary:', results);
  return results;
}

// Export for manual execution
window.runAuthTests = runAuthenticationTests;
window.testAuth = {
  runAll: runAuthenticationTests,
  testSupabase: testSupabaseConnection,
  testRegistration: testRegistrationProcess,
  testConfirmation: testEmailConfirmation,
  testOnboarding: testOnboardingFlow,
  testLogin: testLoginFlow
};

console.log('✅ Authentication test suite loaded!');
console.log('🎯 Run: runAuthTests() to start complete test suite');
console.log('🔧 Or run individual tests: testAuth.testSupabase(), etc.');

// Auto-run basic connection test
testSupabaseConnection(); 