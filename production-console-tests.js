// 🧪 DISLINK PRODUCTION CONSOLE TESTING SUITE
// Copy and paste these functions into your browser console to test authentication
// This version works even if the main app bundles fail to load

console.log('🚀 Dislink Production Testing Suite Loaded!');
console.log('Available functions:');
console.log('- testProductionAuth() - Test authentication with fallbacks');
console.log('- testSupabaseConnection() - Test direct Supabase connection');
console.log('- testSession() - Check current session');
console.log('- testLogin(email, password) - Test login');
console.log('- testRegister(email, password, firstName, lastName) - Test registration');
console.log('- testLogout() - Test logout');

// Test production authentication with multiple fallback methods
async function testProductionAuth() {
  console.log('🧪 Running Production Authentication Test...');
  
  try {
    // Test 1: Check if window.supabaseDebug is available
    if (typeof window.supabaseDebug !== 'undefined') {
      console.log('✅ Supabase debug functions available');
      return await testAuthSetup();
    }
    
    // Test 2: Check if window.supabase is available
    if (typeof window.supabase !== 'undefined') {
      console.log('✅ Direct Supabase client available');
      return await testDirectSupabase();
    }
    
    // Test 3: Try to create Supabase client manually
    console.log('⚠️ No global Supabase client found, trying manual creation...');
    return await testManualSupabase();
    
  } catch (error) {
    console.error('❌ Production authentication test failed:', error);
    return { error: error.message };
  }
}

// Test with direct Supabase client
async function testDirectSupabase() {
  console.log('🔗 Testing with direct Supabase client...');
  
  try {
    // Test connection
    const { data, error } = await window.supabase.auth.getSession();
    console.log('Session Test:', { success: !error, session: data.session, error });
    
    // Test environment
    console.log('Environment Info:');
    console.log('- Current URL:', window.location.href);
    console.log('- Is Production:', window.location.hostname === 'dislinkboltv2duplicate.netlify.app');
    
    return {
      success: !error,
      session: data.session,
      hasSession: !!data.session,
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
      error: error
    };
    
  } catch (error) {
    console.error('❌ Direct Supabase test failed:', error);
    return { error: error.message };
  }
}

// Test with manually created Supabase client
async function testManualSupabase() {
  console.log('🔧 Testing with manual Supabase client...');
  
  try {
    // Try to load Supabase from CDN
    if (typeof window.createClient === 'undefined') {
      console.log('Loading Supabase from CDN...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@supabase/supabase-js@2';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    // Create client with production environment variables
    const supabaseUrl = 'https://bbonxxvifycwpoeaxsor.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjg5NDUsImV4cCI6MjA3MDAwNDk0NX0.rUuAcPIHVCfpAMEU2ADyb0F4Q3_eL0mkEyhBcbu0O70';
    
    const supabase = window.createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { data, error } = await supabase.auth.getSession();
    console.log('Manual Supabase Test:', { success: !error, session: data.session, error });
    
    return {
      success: !error,
      session: data.session,
      hasSession: !!data.session,
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
      error: error
    };
    
  } catch (error) {
    console.error('❌ Manual Supabase test failed:', error);
    return { error: error.message };
  }
}

// Test current session
async function testSession() {
  console.log('🔐 Testing Current Session...');
  
  try {
    let result;
    
    if (window.supabaseDebug && typeof window.supabaseDebug.getSession === 'function') {
      result = await window.supabaseDebug.getSession();
    } else if (window.supabase) {
      const { data: { session }, error } = await window.supabase.auth.getSession();
      result = {
        success: !error,
        session: session,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: error
      };
    } else {
      result = { error: 'No session access available' };
    }
    
    console.log('Session Result:', result);
    if (result.hasSession) {
      console.log('✅ User is logged in:', result.email);
    } else {
      console.log('ℹ️ No active session');
    }
    return result;
    
  } catch (error) {
    console.error('❌ Session test failed:', error);
    return { error: error.message };
  }
}

// Test login
async function testLogin(email, password) {
  console.log('🔑 Testing Login...');
  if (!email || !password) {
    console.log('❌ Please provide email and password: testLogin("your@email.com", "yourpassword")');
    return;
  }
  
  try {
    let result;
    
    if (window.supabaseDebug && typeof window.supabaseDebug.login === 'function') {
      result = await window.supabaseDebug.login(email, password);
    } else if (window.supabase) {
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      result = {
        success: !error,
        session: data.session,
        user: data.user,
        error: error
      };
    } else {
      result = { error: 'No login access available' };
    }
    
    console.log('Login Result:', result);
    if (result.success) {
      console.log('✅ Login successful!');
      console.log('User:', result.user?.email);
    } else {
      console.log('❌ Login failed:', result.error?.message);
    }
    return result;
    
  } catch (error) {
    console.error('❌ Login test failed:', error);
    return { error: error.message };
  }
}

// Test registration
async function testRegister(email, password, firstName, lastName) {
  console.log('📝 Testing Registration...');
  if (!email || !password || !firstName || !lastName) {
    console.log('❌ Please provide all parameters: testRegister("your@email.com", "password", "First", "Last")');
    return;
  }
  
  try {
    let result;
    
    if (window.supabaseDebug && typeof window.supabaseDebug.register === 'function') {
      result = await window.supabaseDebug.register(email, password, firstName, lastName);
    } else if (window.supabase) {
      const { data, error } = await window.supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            firstName: firstName,
            lastName: lastName,
            full_name: `${firstName} ${lastName}`
          },
          emailRedirectTo: `${window.location.origin}/confirmed`
        }
      });
      result = {
        success: !error,
        user: data.user,
        session: data.session,
        error: error
      };
    } else {
      result = { error: 'No registration access available' };
    }
    
    console.log('Registration Result:', result);
    if (result.success) {
      console.log('✅ Registration successful!');
      console.log('User ID:', result.user?.id);
      console.log('Email confirmation required:', !result.session);
    } else {
      console.log('❌ Registration failed:', result.error?.message);
    }
    return result;
    
  } catch (error) {
    console.error('❌ Registration test failed:', error);
    return { error: error.message };
  }
}

// Test logout
async function testLogout() {
  console.log('🚪 Testing Logout...');
  
  try {
    let result;
    
    if (window.supabaseDebug && typeof window.supabaseDebug.logout === 'function') {
      result = await window.supabaseDebug.logout();
    } else if (window.supabase) {
      const { error } = await window.supabase.auth.signOut();
      result = {
        success: !error,
        error: error
      };
    } else {
      result = { error: 'No logout access available' };
    }
    
    console.log('Logout Result:', result);
    if (result.success) {
      console.log('✅ Logout successful!');
    } else {
      console.log('❌ Logout failed:', result.error?.message);
    }
    return result;
    
  } catch (error) {
    console.error('❌ Logout test failed:', error);
    return { error: error.message };
  }
}

// Test Supabase connection
async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection...');
  
  try {
    let result;
    
    if (window.supabaseDebug && typeof window.supabaseDebug.testConnection === 'function') {
      result = await window.supabaseDebug.testConnection();
    } else if (window.supabase) {
      // Test basic connection
      const { data, error } = await window.supabase.auth.getSession();
      result = {
        success: !error,
        message: error ? 'Connection failed' : 'Supabase connection successful',
        error: error
      };
    } else {
      result = { error: 'No Supabase client available' };
    }
    
    console.log('Connection Result:', result);
    if (result.success) {
      console.log('✅ Supabase connection successful!');
    } else {
      console.log('❌ Supabase connection failed:', result.error?.message);
    }
    return result;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { error: error.message };
  }
}

// Quick test with sample data
async function quickTest() {
  console.log('⚡ Running Quick Test with Sample Data...');
  const testEmail = `test.${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  console.log('Using test email:', testEmail);
  
  // Test registration
  console.log('1. Testing registration...');
  const registerResult = await testRegister(testEmail, testPassword, 'Test', 'User');
  if (registerResult.success) {
    console.log('2. Registration successful, testing login...');
    // Wait a moment then test login
    setTimeout(async () => {
      const loginResult = await testLogin(testEmail, testPassword);
      if (loginResult.success) {
        console.log('3. Login successful, testing logout...');
        setTimeout(async () => {
          await testLogout();
        }, 1000);
      }
    }, 1000);
  }
}

console.log('🎉 Production testing suite ready! Try: testProductionAuth()');
