#!/usr/bin/env node

/**
 * Comprehensive Authentication Flow Test
 * Tests the complete Supabase authentication setup for Dislink
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true
  }
});

// Test configuration
const TEST_EMAIL = `test.auth.${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_FIRST_NAME = 'Test';
const TEST_LAST_NAME = 'User';

console.log('🧪 Starting Comprehensive Authentication Flow Test');
console.log('=' .repeat(60));
console.log(`📧 Test Email: ${TEST_EMAIL}`);
console.log(`🔑 Test Password: ${TEST_PASSWORD}`);
console.log(`🌐 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);
console.log('=' .repeat(60));

async function testSupabaseConnection() {
  console.log('\n🔍 Testing Supabase Connection...');
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n📝 Testing User Registration...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          firstName: TEST_FIRST_NAME,
          lastName: TEST_LAST_NAME,
          full_name: `${TEST_FIRST_NAME} ${TEST_LAST_NAME}`
        },
        emailRedirectTo: 'https://dislinkboltv2duplicate.netlify.app/confirmed'
      }
    });

    if (error) {
      console.error('❌ Registration failed:', error.message);
      return false;
    }

    if (data.user) {
      console.log('✅ Registration successful');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Has Session: ${data.session ? 'Yes' : 'No'}`);
      return true;
    }

    console.log('⚠️ Registration completed but no user data returned');
    return false;
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('\n🔐 Testing User Login...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      return false;
    }

    if (data.user && data.session) {
      console.log('✅ Login successful');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Session Expires: ${new Date(data.session.expires_at * 1000).toISOString()}`);
      console.log(`   Access Token: ${data.session.access_token.substring(0, 20)}...`);
      return true;
    }

    console.log('⚠️ Login completed but no session returned');
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testSessionPersistence() {
  console.log('\n💾 Testing Session Persistence...');
  
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Session retrieval failed:', error.message);
      return false;
    }

    if (session) {
      console.log('✅ Session persistence working');
      console.log(`   User ID: ${session.user.id}`);
      console.log(`   Session Expires: ${new Date(session.expires_at * 1000).toISOString()}`);
      console.log(`   Refresh Token: ${session.refresh_token ? 'Present' : 'Missing'}`);
      return true;
    }

    console.log('⚠️ No active session found');
    return false;
  } catch (error) {
    console.error('❌ Session persistence error:', error.message);
    return false;
  }
}

async function testProfileCreation() {
  console.log('\n👤 Testing Profile Creation...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('⚠️ No authenticated user for profile test');
      return false;
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Profile check failed:', profileError.message);
      return false;
    }

    if (existingProfile) {
      console.log('✅ Profile already exists');
      console.log(`   Profile ID: ${existingProfile.id}`);
      console.log(`   First Name: ${existingProfile.first_name}`);
      console.log(`   Last Name: ${existingProfile.last_name}`);
      console.log(`   Email: ${existingProfile.email}`);
      return true;
    }

    // Create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        first_name: TEST_FIRST_NAME,
        last_name: TEST_LAST_NAME,
        full_name: `${TEST_FIRST_NAME} ${TEST_LAST_NAME}`,
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Profile creation failed:', createError.message);
      return false;
    }

    console.log('✅ Profile created successfully');
    console.log(`   Profile ID: ${newProfile.id}`);
    console.log(`   First Name: ${newProfile.first_name}`);
    console.log(`   Last Name: ${newProfile.last_name}`);
    return true;
  } catch (error) {
    console.error('❌ Profile creation error:', error.message);
    return false;
  }
}

async function testLogout() {
  console.log('\n🚪 Testing Logout...');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Logout failed:', error.message);
      return false;
    }

    console.log('✅ Logout successful');
    
    // Verify session is cleared
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('✅ Session cleared successfully');
      return true;
    } else {
      console.log('⚠️ Session still exists after logout');
      return false;
    }
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    return false;
  }
}

async function testEnvironmentDetection() {
  console.log('\n🌍 Testing Environment Detection...');
  
  const isProduction = process.env.NODE_ENV === 'production';
  const appUrl = process.env.VITE_APP_URL;
  const siteUrl = process.env.VITE_SITE_URL;
  
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Is Production: ${isProduction}`);
  console.log(`   App URL: ${appUrl || 'Not set'}`);
  console.log(`   Site URL: ${siteUrl || 'Not set'}`);
  
  // Test redirect URL generation
  const expectedRedirectUrl = isProduction 
    ? 'https://dislinkboltv2duplicate.netlify.app/confirmed'
    : 'http://localhost:3001/confirmed';
  
  console.log(`   Expected Redirect URL: ${expectedRedirectUrl}`);
  
  if (appUrl && siteUrl) {
    console.log('✅ Environment variables properly configured');
    return true;
  } else {
    console.log('⚠️ Some environment variables missing');
    return false;
  }
}

async function runAllTests() {
  const results = {
    connection: false,
    registration: false,
    login: false,
    sessionPersistence: false,
    profileCreation: false,
    logout: false,
    environmentDetection: false
  };

  try {
    // Test environment detection first
    results.environmentDetection = await testEnvironmentDetection();
    
    // Test Supabase connection
    results.connection = await testSupabaseConnection();
    
    if (!results.connection) {
      console.log('\n❌ Cannot proceed with authentication tests - Supabase connection failed');
      return results;
    }

    // Test user registration
    results.registration = await testUserRegistration();
    
    // Test user login
    results.login = await testUserLogin();
    
    if (results.login) {
      // Test session persistence
      results.sessionPersistence = await testSessionPersistence();
      
      // Test profile creation
      results.profileCreation = await testProfileCreation();
      
      // Test logout
      results.logout = await testLogout();
    }

    return results;
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    return results;
  }
}

async function main() {
  const results = await runAllTests();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const testNames = {
    connection: 'Supabase Connection',
    registration: 'User Registration',
    login: 'User Login',
    sessionPersistence: 'Session Persistence',
    profileCreation: 'Profile Creation',
    logout: 'User Logout',
    environmentDetection: 'Environment Detection'
  };
  
  let passedTests = 0;
  let totalTests = 0;
  
  Object.entries(results).forEach(([key, passed]) => {
    totalTests++;
    if (passed) passedTests++;
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = testNames[key] || key;
    console.log(`${status} ${testName}`);
  });
  
  console.log('=' .repeat(60));
  console.log(`📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Authentication system is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});
