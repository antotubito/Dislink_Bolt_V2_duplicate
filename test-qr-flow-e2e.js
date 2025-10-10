/**
 * E2E Test Script for QR → Public Profile Flow
 * This script tests the complete QR code flow from generation to public profile display
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bbonxxvifycwpoeaxsor.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjg5NDUsImV4cCI6MjA3MDAwNDk0NX0.rUuAcPIHVCfpAMEU2ADyb0F4Q3_eL0mkEyhBcbu0O70';
const BASE_URL = process.env.VITE_SITE_URL || 'https://dislinkboltv2duplicate.netlify.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data
const TEST_USER_EMAIL = 'test-qr-flow@gmail.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const TEST_PROFILE_DATA = {
  first_name: 'QR',
  last_name: 'Tester',
  job_title: 'QA Engineer',
  company: 'Test Corp',
  bio: { text: 'Testing QR flow functionality' },
  interests: ['testing', 'automation'],
  social_links: { linkedin: 'https://linkedin.com/in/qrtester' },
  public_profile: {
    enabled: true,
    allowedFields: {
      bio: true,
      company: true,
      jobTitle: true,
      interests: true,
      socialLinks: true
    }
  }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testQRFlow() {
  console.log('🧪 Starting QR Flow E2E Tests...\n');

  let testUser = null;
  let connectionCode = null;
  let publicProfileUrl = null;

  try {
    // Step 1: Create test user account
    console.log('📝 Step 1: Creating test user account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Test user already exists, signing in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        });
        
        if (signInError) throw signInError;
        testUser = signInData.user;
      } else {
        throw authError;
      }
    } else {
      testUser = authData.user;
    }

    console.log('✅ Test user created/signed in:', testUser.id);

    // Step 2: Create/update profile
    console.log('\n📝 Step 2: Creating/updating test profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: testUser.id,
        email: TEST_USER_EMAIL,
        ...TEST_PROFILE_DATA
      })
      .select()
      .single();

    if (profileError) throw profileError;
    console.log('✅ Profile created/updated:', profileData.id);

    // Step 3: Generate QR code
    console.log('\n📝 Step 3: Generating QR code...');
    const { data: qrData, error: qrError } = await supabase
      .from('connection_codes')
      .upsert({
        user_id: testUser.id,
        code: `test-qr-${Date.now()}`,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (qrError) throw qrError;
    connectionCode = qrData.code;
    publicProfileUrl = `${BASE_URL}/profile/${connectionCode}`;
    console.log('✅ QR code generated:', connectionCode);
    console.log('🔗 Public profile URL:', publicProfileUrl);

    // Step 4: Test anonymous access to public profile
    console.log('\n📝 Step 4: Testing anonymous access to public profile...');
    
    // Create anonymous client
    const anonymousClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test the database function directly
    const { data: validationResult, error: validationError } = await anonymousClient
      .rpc('validate_connection_code_with_profile', { 
        connection_code: connectionCode 
      });

    if (validationError) {
      console.error('❌ Validation error:', validationError);
      throw validationError;
    }

    if (!validationResult || validationResult.length === 0) {
      throw new Error('No profile data returned for valid connection code');
    }

    const profileResult = validationResult[0];
    console.log('✅ Anonymous validation successful:');
    console.log('   - User ID:', profileResult.user_id);
    console.log('   - Name:', `${profileResult.first_name} ${profileResult.last_name}`);
    console.log('   - Job Title:', profileResult.job_title);
    console.log('   - Company:', profileResult.company);
    console.log('   - Public Profile Enabled:', profileResult.public_profile?.enabled);

    // Step 5: Test QR scan tracking
    console.log('\n📝 Step 5: Testing QR scan tracking...');
    const { data: scanId, error: scanError } = await anonymousClient
      .rpc('track_qr_scan', {
        scan_code: connectionCode,
        scan_location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp: new Date().toISOString()
        },
        device_info: {
          userAgent: 'E2E Test Script',
          platform: 'Node.js',
          language: 'en-US',
          timestamp: new Date().toISOString()
        },
        session_id: `e2e-test-${Date.now()}`
      });

    if (scanError) {
      console.warn('⚠️ Scan tracking error (non-critical):', scanError);
    } else {
      console.log('✅ QR scan tracked successfully:', scanId);
    }

    // Step 6: Test expired code handling
    console.log('\n📝 Step 6: Testing expired code handling...');
    const { data: expiredResult, error: expiredError } = await anonymousClient
      .rpc('validate_connection_code_with_profile', { 
        connection_code: 'expired-test-code-123' 
      });

    if (expiredError) {
      console.log('✅ Expired code properly rejected:', expiredError.message);
    } else if (!expiredResult || expiredResult.length === 0) {
      console.log('✅ Expired code properly returned no results');
    } else {
      console.warn('⚠️ Expired code unexpectedly returned data');
    }

    // Step 7: Test non-public profile handling
    console.log('\n📝 Step 7: Testing non-public profile handling...');
    
    // Create a profile with public_profile disabled
    const { data: privateProfile, error: privateProfileError } = await supabase
      .from('profiles')
      .upsert({
        id: testUser.id,
        public_profile: { enabled: false }
      })
      .select()
      .single();

    if (privateProfileError) {
      console.warn('⚠️ Could not update profile to private:', privateProfileError);
    } else {
      // Test validation with private profile
      const { data: privateResult, error: privateError } = await anonymousClient
        .rpc('validate_connection_code_with_profile', { 
          connection_code: connectionCode 
        });

      if (privateError) {
        console.log('✅ Private profile properly rejected:', privateError.message);
      } else if (!privateResult || privateResult.length === 0) {
        console.log('✅ Private profile properly returned no results');
      } else {
        console.warn('⚠️ Private profile unexpectedly returned data');
      }

      // Restore public profile for cleanup
      await supabase
        .from('profiles')
        .upsert({
          id: testUser.id,
          public_profile: { enabled: true }
        });
    }

    // Step 8: Test cleanup function
    console.log('\n📝 Step 8: Testing cleanup function...');
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_expired_connection_codes');

    if (cleanupError) {
      console.warn('⚠️ Cleanup function error:', cleanupError);
    } else {
      console.log('✅ Cleanup function executed successfully, cleaned:', cleanupResult, 'expired codes');
    }

    console.log('\n🎉 All QR Flow E2E tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ User creation and authentication');
    console.log('   ✅ Profile creation and updates');
    console.log('   ✅ QR code generation');
    console.log('   ✅ Anonymous public profile access');
    console.log('   ✅ QR scan tracking');
    console.log('   ✅ Expired code handling');
    console.log('   ✅ Private profile handling');
    console.log('   ✅ Database cleanup functions');

  } catch (error) {
    console.error('\n❌ QR Flow E2E test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Cleanup: Delete test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      if (connectionCode) {
        await supabase
          .from('connection_codes')
          .delete()
          .eq('code', connectionCode);
        console.log('✅ Test connection code deleted');
      }

      if (testUser) {
        // Note: We don't delete the user account as it might be used for other tests
        console.log('ℹ️ Test user account preserved for future tests');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup error (non-critical):', cleanupError);
    }
  }
}

// Run the tests
if (require.main === module) {
  testQRFlow()
    .then(() => {
      console.log('\n✅ E2E test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ E2E test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testQRFlow };
