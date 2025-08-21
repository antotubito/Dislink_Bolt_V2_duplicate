// Authentication Configuration Diagnostic Script
console.log('🔍 AUTHENTICATION DIAGNOSTIC REPORT');
console.log('==================================');

// 1. Check Environment Variables
console.log('\n📋 ENVIRONMENT VARIABLES:');
console.log('VITE_SUPABASE_URL available:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY available:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Environment mode:', import.meta.env.MODE);
console.log('Production build:', import.meta.env.PROD);

// 2. Check Supabase Client
import { supabase } from './src/lib/supabase.js';
console.log('\n🔗 SUPABASE CLIENT:');
console.log('Client initialized:', !!supabase);
console.log('Auth client:', !!supabase.auth);

// 3. Test Connection
console.log('\n🧪 CONNECTION TEST:');
try {
  const { data, error } = await supabase.auth.getSession();
  console.log('Session check success:', !error);
  console.log('Current session:', !!data?.session);
  if (error) console.error('Session error:', error);
} catch (err) {
  console.error('Connection failed:', err);
}

// 4. Test Supabase URL
console.log('\n🌐 URL CONFIGURATION:');
console.log('Expected URL: https://bbonxxvifycwpoeaxsor.supabase.co');
console.log('Current URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('URLs match:', import.meta.env.VITE_SUPABASE_URL === 'https://bbonxxvifycwpoeaxsor.supabase.co');

console.log('\n✅ Diagnostic Complete');
