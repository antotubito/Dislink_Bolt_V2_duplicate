#!/usr/bin/env node

/**
 * Simple Authentication Flow Test
 * Tests the Supabase authentication setup without external dependencies
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Failed to load .env.local file:', error.message);
    return {};
  }
}

const envVars = loadEnvFile();
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

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

console.log('🧪 Starting Simple Authentication Flow Test');
console.log('=' .repeat(50));
console.log(`📧 Test Email: ${TEST_EMAIL}`);
console.log(`🌐 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);
console.log('=' .repeat(50));

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
          firstName: 'Test',
          lastName: 'User',
          full_name: 'Test User'
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
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Session retrieval failed:', error.message);
      return false;
    }

    if (session) {
      console.log('✅ Session persistence working');
      console.log(`   User ID: ${session.user.id}`);
      console.log(`   Session Expires: ${new Date(session.expires_at * 1000).toISOString()}`);
      return true;
    }

    console.log('⚠️ No active session found');
    return false;
  } catch (error) {
    console.error('❌ Session persistence error:', error.message);
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

async function main() {
  const results = {
    connection: false,
    registration: false,
    login: false,
    sessionPersistence: false,
    logout: false
  };

  try {
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
      
      // Test logout
      results.logout = await testLogout();
    }

    return results;
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    return results;
  }
}

async function runTests() {
  const results = await main();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  const testNames = {
    connection: 'Supabase Connection',
    registration: 'User Registration',
    login: 'User Login',
    sessionPersistence: 'Session Persistence',
    logout: 'User Logout'
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
  
  console.log('=' .repeat(50));
  console.log(`📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Authentication system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the issues above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite crashed:', error);
});
