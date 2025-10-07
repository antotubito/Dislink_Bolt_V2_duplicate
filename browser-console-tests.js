// 🧪 DISLINK AUTHENTICATION TESTING SUITE
// Copy and paste these functions into your browser console to test authentication

console.log('🚀 Dislink Authentication Testing Suite Loaded!');
console.log('Available functions:');
console.log('- testAuthSetup() - Complete authentication test');
console.log('- testSession() - Check current session');
console.log('- testLogin(email, password) - Test login');
console.log('- testRegister(email, password, firstName, lastName) - Test registration');
console.log('- testLogout() - Test logout');
console.log('- testConnection() - Test Supabase connection');

// Complete authentication setup test
async function testAuthSetup() {
  console.log('🧪 Running Complete Authentication Test...');
  
  try {
    // Test 1: Check if debug functions are available
    if (typeof window.supabaseDebug === 'undefined') {
      console.log('❌ Supabase debug functions not available. Make sure the app is loaded.');
      return;
    }
    console.log('✅ Supabase debug functions available');
    
    // Test 2: Test connection
    console.log('🔗 Testing Supabase connection...');
    const connectionTest = await window.supabaseDebug.testConnection();
    console.log('Connection Test:', connectionTest);
    
    // Test 3: Check current session
    console.log('🔐 Checking current session...');
    let sessionTest;
    if (window.supabaseDebug && typeof window.supabaseDebug.getSession === 'function') {
      sessionTest = await window.supabaseDebug.getSession();
    } else if (window.supabase) {
      // Fallback to direct supabase access
      const { data: { session }, error } = await window.supabase.auth.getSession();
      sessionTest = {
        success: !error,
        session: session,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: error
      };
    } else {
      sessionTest = { error: 'No session access available' };
    }
    console.log('Session Test:', sessionTest);
    
    // Test 4: Environment info
    console.log('🔍 Environment Info:');
    console.log('- Current URL:', window.location.href);
    console.log('- Base URL:', window.supabaseDebug.getBaseUrl());
    console.log('- Is Production:', window.location.hostname === 'dislinkboltv2duplicate.netlify.app');
    console.log('- Connection Healthy:', window.supabaseDebug.isConnectionHealthy());
    console.log('- Supabase Ready:', window.supabaseDebug.isSupabaseSessionReady());
    
    console.log('✅ Complete authentication test finished!');
    return {
      connection: connectionTest,
      session: sessionTest,
      environment: {
        url: window.location.href,
        baseUrl: window.supabaseDebug.getBaseUrl(),
        isProduction: window.location.hostname === 'dislinkboltv2duplicate.netlify.app'
      }
    };
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    return { error: error.message };
  }
}

// Test current session
async function testSession() {
  console.log('🔐 Testing Current Session...');
  
  try {
    // Try the debug function first, fallback to direct supabase access
    let result;
    if (window.supabaseDebug && typeof window.supabaseDebug.getSession === 'function') {
      result = await window.supabaseDebug.getSession();
    } else if (window.supabase) {
      // Fallback to direct supabase access
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
      throw new Error('Neither supabaseDebug.getSession nor window.supabase is available');
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
    const result = await window.supabaseDebug.login(email, password);
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
    const result = await window.supabaseDebug.register(email, password, firstName, lastName);
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
    const result = await window.supabaseDebug.logout();
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

// Test connection
async function testConnection() {
  console.log('🔗 Testing Supabase Connection...');
  
  try {
    const result = await window.supabaseDebug.testConnection();
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
  const testPassword = 'testpassword123';
  
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

console.log('🎉 Testing suite ready! Try: testAuthSetup()');
