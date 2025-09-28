/// <reference types="vite/client" />

// 🔍 COMPREHENSIVE PRODUCTION TEST FUNCTION
export const runFullProductionTest = async () => {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      url: import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
      urlActual: import.meta.env.VITE_SUPABASE_URL,
      keyPresent: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
    }
  };
  console.log('Production Test Results:', testResults);
  return testResults;
};

// 🔍 ENHANCED PRODUCTION TEST WITH LIVE TESTING
export const runLiveProductionTest = async () => {
  console.log('🔍 🚀 STARTING LIVE PRODUCTION TEST');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      url: import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
      keyPresent: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    tests: {}
  };

  // Test 1: Environment Variables
  console.log('🔍 Test 1: Environment variables');
  testResults.tests.envVars = {
    status: (supabaseUrl && supabaseAnonKey) ? 'SUCCESS' : 'FAILED',
    urlPresent: !!supabaseUrl,
    keyPresent: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0
  };

  // Test 2: Live Database Query
  console.log('🔍 Test 2: Live database connectivity');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    testResults.tests.liveQuery = {
      status: error ? 'FAILED' : 'SUCCESS',
      error: error?.message,
      recordCount: data?.length || 0
    };
  } catch (queryError) {
    testResults.tests.liveQuery = {
      status: 'EXCEPTION',
      error: queryError.message
    };
  }

  // Test 3: Auth State Check
  console.log('🔍 Test 3: Auth state');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    testResults.tests.authState = {
      status: error ? 'ERROR' : 'SUCCESS',
      error: error?.message,
      hasSession: !!session
    };
  } catch (authError) {
    testResults.tests.authState = {
      status: 'EXCEPTION',
      error: authError.message
    };
  }

  // Test 4: Test Invalid Login (Should Fail Gracefully)
  console.log('🔍 Test 4: Auth error handling');
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@invalid.com',
      password: 'invalid'
    });
    testResults.tests.authErrorHandling = {
      status: error ? 'SUCCESS' : 'UNEXPECTED'
    };
  } catch (authError) {
    testResults.tests.authErrorHandling = {
      status: 'EXCEPTION',
      error: authError.message
    };
  }

  // Basic connectivity test
  fetch('https://bbonxxvifycwpoeaxsor.supabase.co/auth/v1/settings')
    .then(r => r.json())
    .then(data => console.log('Auth settings:', data))
    .catch(err => console.error('Auth test failed:', err));
};

// Enhanced user diagnosis function
async function diagnoseUser(email) {
  console.log('🔍 Starting comprehensive user diagnosis for:', email);
  
  try {
    // Test 1: Check profiles table directly
    const response = await fetch(`https://bbonxxvifycwpoeaxsor.supabase.co/rest/v1/profiles?email=eq.${email}`, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjg5NDUsImV4cCI6MjA3MDAwNDk0NX0.rUuAcPIHVCfpAMEU2ADyb0F4Q3_eL0mkEyhBcbu0O70',
        'Content-Type': 'application/json'
      }
    });
    
    const profiles = await response.json();
    console.log('🔍 Profiles table result:', profiles);
    
    // Test 2: Try a test signup to check auth state
    const testSignup = await fetch('https://bbonxxvifycwpoeaxsor.supabase.co/auth/v1/signup', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjg5NDUsImV4cCI6MjA3MDAwNDk0NX0.rUuAcPIHVCfpAMEU2ADyb0F4Q3_eL0mkEyhBcbu0O70',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: 'test-password-123'
      })
    });
    
    const signupResult = await testSignup.json();
    console.log('🔍 Test signup result:', signupResult);
    
    // Analysis
    const analysis = {
      userExists: profiles.length > 0,
      profileData: profiles[0] || null,
      authState: signupResult.error ? signupResult.error.message : 'Available for signup',
      recommendation: ''
    };
    
    if (profiles.length > 0) {
      analysis.recommendation = 'User exists in profiles table';
      if (signupResult.error && signupResult.error.message.includes('already')) {
        analysis.recommendation += ' and in auth system - try password reset';
      } else {
        analysis.recommendation += ' but may need email confirmation';
      }
    } else {
      analysis.recommendation = 'User does not exist - registration should work';
    }
    
    console.log('🎯 FINAL ANALYSIS:', analysis);
    return analysis;
    
  } catch (error) {
    console.error('🔍 Diagnosis error:', error);
    return { error: error.message };
  }
}

// Run diagnosis for your user
await diagnoseUser('anto.tubito@gmail.com');
