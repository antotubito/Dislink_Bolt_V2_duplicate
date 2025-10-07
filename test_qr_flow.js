/**
 * QR Profile Flow Test Script
 * Tests the end-to-end QR code generation and validation flow
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bbonxxvifycwpoeaxsor.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test QR code generation and validation flow
 */
async function testQRFlow() {
  console.log('🧪 Starting QR Profile Flow Test...\n');

  try {
    // Step 1: Test anonymous access to connection_codes
    console.log('1️⃣ Testing anonymous access to connection_codes...');
    const { data: connectionCodes, error: codesError } = await supabase
      .from('connection_codes')
      .select('id, code, is_active, expires_at, user_id')
      .eq('is_active', true)
      .limit(1);

    if (codesError) {
      console.error('❌ Failed to access connection_codes:', codesError);
      return;
    }

    if (!connectionCodes || connectionCodes.length === 0) {
      console.warn('⚠️ No active connection codes found. Creating a test one...');
      // You would need to create a test connection code here
      return;
    }

    const testCode = connectionCodes[0];
    console.log('✅ Found active connection code:', testCode.code);

    // Step 2: Test anonymous access to profiles
    console.log('\n2️⃣ Testing anonymous access to profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, public_profile')
      .eq('id', testCode.user_id)
      .single();

    if (profilesError) {
      console.error('❌ Failed to access profiles:', profilesError);
      return;
    }

    if (!profiles) {
      console.error('❌ No profile found for user:', testCode.user_id);
      return;
    }

    console.log('✅ Found profile:', {
      id: profiles.id,
      name: `${profiles.first_name} ${profiles.last_name}`,
      publicProfileEnabled: profiles.public_profile?.enabled
    });

    // Step 3: Test the full validation flow
    console.log('\n3️⃣ Testing full validation flow...');
    
    // Simulate the validateConnectionCode function
    const validationResult = await validateConnectionCode(testCode.code);
    
    if (validationResult) {
      console.log('✅ QR validation successful:', {
        userId: validationResult.userId,
        name: validationResult.name,
        connectionCode: validationResult.connectionCode
      });
    } else {
      console.error('❌ QR validation failed');
    }

    // Step 4: Test URL generation
    console.log('\n4️⃣ Testing URL generation...');
    const testUrl = `https://dislinkboltv2duplicate.netlify.app/profile/${testCode.code}`;
    console.log('✅ Generated QR URL:', testUrl);

    console.log('\n🎉 QR Flow Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

/**
 * Simulate the validateConnectionCode function
 */
async function validateConnectionCode(code) {
  try {
    console.log('🔍 Validating connection code:', code);

    // First, check if the connection code exists and is active
    const { data: connectionData, error } = await supabase
      .from('connection_codes')
      .select(`
        id,
        user_id,
        code,
        is_active,
        expires_at
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !connectionData) {
      console.warn('⚠️ No active connection code found:', code);
      return null;
    }

    // Check if code is expired
    if (connectionData.expires_at && new Date() > new Date(connectionData.expires_at)) {
      console.warn('⚠️ Connection code expired:', code);
      return null;
    }

    // Now get the associated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        job_title,
        company,
        profile_image,
        bio,
        interests,
        social_links,
        public_profile
      `)
      .eq('id', connectionData.user_id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found for user:', connectionData.user_id);
      return null;
    }

    // Check if public profile is enabled
    if (!profile.public_profile?.enabled) {
      console.warn('⚠️ Public profile not enabled for user:', profile.id);
      return null;
    }

    return {
      userId: profile.id,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      jobTitle: profile.job_title,
      company: profile.company,
      profileImage: profile.profile_image,
      bio: profile.bio,
      interests: profile.interests || [],
      socialLinks: profile.social_links || {},
      publicProfile: profile.public_profile,
      connectionCode: code,
      publicProfileUrl: `https://dislinkboltv2duplicate.netlify.app/profile/${code}`
    };

  } catch (error) {
    console.error('❌ Error validating connection code:', error);
    return null;
  }
}

/**
 * Test RLS policies specifically
 */
async function testRLSPolicies() {
  console.log('🔐 Testing RLS Policies...\n');

  try {
    // Test 1: Anonymous access to connection_codes
    console.log('1️⃣ Testing anonymous access to connection_codes...');
    const { data: codes, error: codesError } = await supabase
      .from('connection_codes')
      .select('*')
      .limit(1);

    if (codesError) {
      console.error('❌ Connection codes access failed:', codesError);
    } else {
      console.log('✅ Connection codes access successful');
    }

    // Test 2: Anonymous access to profiles with public_profile enabled
    console.log('\n2️⃣ Testing anonymous access to public profiles...');
    const { data: publicProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, public_profile')
      .eq('public_profile->>enabled', 'true')
      .limit(1);

    if (profilesError) {
      console.error('❌ Public profiles access failed:', profilesError);
    } else {
      console.log('✅ Public profiles access successful');
      if (publicProfiles && publicProfiles.length > 0) {
        console.log('   Found public profile:', publicProfiles[0].first_name, publicProfiles[0].last_name);
      }
    }

  } catch (error) {
    console.error('❌ RLS policy test failed:', error);
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting QR Flow Tests...\n');
  
  // Test RLS policies first
  await testRLSPolicies();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Then test the full flow
  await testQRFlow();
}

export { testQRFlow, testRLSPolicies, validateConnectionCode };
