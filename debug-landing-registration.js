// 🧪 DEBUG LANDING PAGE & REGISTRATION ISSUES
// Copy and paste these functions into your browser console to debug

console.log('🚀 Landing Page & Registration Debug Suite Loaded!');
console.log('Available functions:');
console.log('- debugLandingPage() - Check landing page issues');
console.log('- debugRegistration() - Test registration flow');
console.log('- debugSupabaseConnection() - Check Supabase connection');
console.log('- debugRouting() - Check routing issues');

// 1. Debug Landing Page Issues
function debugLandingPage() {
  console.log('\n🔹 Debugging Landing Page...');
  
  try {
    // Check if we're on the right page
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Check if LandingPage component is rendered
    const landingElements = document.querySelectorAll('[data-testid="landing-page"], .landing-page, #landing-page');
    console.log('Landing page elements found:', landingElements.length);
    
    // Check for React root
    const reactRoot = document.getElementById('root');
    console.log('React root element:', reactRoot ? 'Found' : 'Not found');
    
    if (reactRoot) {
      console.log('React root children:', reactRoot.children.length);
      console.log('React root innerHTML length:', reactRoot.innerHTML.length);
    }
    
    // Check for any error messages
    const errorElements = document.querySelectorAll('.error, [class*="error"], [class*="Error"]');
    console.log('Error elements found:', errorElements.length);
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('.loading, [class*="loading"], [class*="Loading"]');
    console.log('Loading elements found:', loadingElements.length);
    
    // Check console for errors
    console.log('Check browser console for any React errors or network issues');
    
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      reactRoot: !!reactRoot,
      rootChildren: reactRoot?.children.length || 0,
      errorElements: errorElements.length,
      loadingElements: loadingElements.length
    };
    
  } catch (error) {
    console.error('Error debugging landing page:', error);
    return { error: error.message };
  }
}

// 2. Debug Registration Issues
async function debugRegistration() {
  console.log('\n🔹 Debugging Registration...');
  
  try {
    // Check if Supabase is available
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase client not available');
      return { error: 'Supabase client not available' };
    }
    
    console.log('✅ Supabase client available');
    
    // Test Supabase connection
    const { data, error } = await window.supabase.auth.getSession();
    console.log('Current session:', data.session ? 'Active' : 'None');
    console.log('Session error:', error);
    
    // Test registration with dummy data
    console.log('Testing registration with dummy data...');
    const testData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const { data: regData, error: regError } = await window.supabase.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
          firstName: testData.firstName,
          lastName: testData.lastName,
          full_name: `${testData.firstName} ${testData.lastName}`
        }
      }
    });
    
    console.log('Registration test result:', {
      success: !regError,
      error: regError?.message,
      user: regData?.user ? 'Created' : 'Not created'
    });
    
    return {
      supabaseAvailable: true,
      currentSession: !!data.session,
      registrationTest: {
        success: !regError,
        error: regError?.message
      }
    };
    
  } catch (error) {
    console.error('Error debugging registration:', error);
    return { error: error.message };
  }
}

// 3. Debug Supabase Connection
async function debugSupabaseConnection() {
  console.log('\n🔹 Debugging Supabase Connection...');
  
  try {
    // Check environment variables
    console.log('Environment check:');
    console.log('- VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL ? 'Set' : 'Not set');
    console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
    
    // Check if Supabase client is available
    if (typeof window.supabase === 'undefined') {
      console.error('❌ window.supabase not available');
      return { error: 'Supabase client not available' };
    }
    
    console.log('✅ Supabase client available');
    
    // Test basic connection
    const { data, error } = await window.supabase.from('profiles').select('count').limit(1);
    console.log('Database connection test:', error ? `Error: ${error.message}` : 'Success');
    
    // Test auth connection
    const { data: authData, error: authError } = await window.supabase.auth.getSession();
    console.log('Auth connection test:', authError ? `Error: ${authError.message}` : 'Success');
    
    return {
      supabaseAvailable: true,
      databaseConnection: !error,
      authConnection: !authError,
      databaseError: error?.message,
      authError: authError?.message
    };
    
  } catch (error) {
    console.error('Error debugging Supabase connection:', error);
    return { error: error.message };
  }
}

// 4. Debug Routing Issues
function debugRouting() {
  console.log('\n🔹 Debugging Routing...');
  
  try {
    // Check current route
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.log('Current search params:', window.location.search);
    console.log('Current hash:', window.location.hash);
    
    // Check if React Router is working
    const routerElements = document.querySelectorAll('[data-testid*="router"], .router, #router');
    console.log('Router elements found:', routerElements.length);
    
    // Check for navigation elements
    const navElements = document.querySelectorAll('nav, [role="navigation"], .navigation');
    console.log('Navigation elements found:', navElements.length);
    
    // Check for route-specific content
    const routeContent = document.querySelectorAll('[data-testid*="route"], .route-content');
    console.log('Route content elements found:', routeContent.length);
    
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      routerElements: routerElements.length,
      navElements: navElements.length,
      routeContent: routeContent.length
    };
    
  } catch (error) {
    console.error('Error debugging routing:', error);
    return { error: error.message };
  }
}

// Run all debug functions
async function runAllDebugTests() {
  console.log('\n🚀 RUNNING ALL DEBUG TESTS');
  console.log('==========================');
  
  const results = {
    landingPage: debugLandingPage(),
    supabaseConnection: await debugSupabaseConnection(),
    routing: debugRouting(),
    registration: await debugRegistration()
  };
  
  console.log('\n📊 DEBUG RESULTS SUMMARY');
  console.log('========================');
  console.log('Landing Page:', results.landingPage);
  console.log('Supabase Connection:', results.supabaseConnection);
  console.log('Routing:', results.routing);
  console.log('Registration:', results.registration);
  
  return results;
}

console.log('\n🎯 Ready to debug! Try:');
console.log('- debugLandingPage() - Check landing page issues');
console.log('- debugRegistration() - Test registration flow');
console.log('- debugSupabaseConnection() - Check Supabase connection');
console.log('- debugRouting() - Check routing issues');
console.log('- runAllDebugTests() - Run all tests');
