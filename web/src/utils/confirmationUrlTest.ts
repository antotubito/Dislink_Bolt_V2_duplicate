// Test utility to diagnose confirmation URL parameters
import { supabase } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';

// Add this to your browser console to test current URL
declare global {
  interface Window {
    testConfirmationUrl: (url?: string) => Promise<any>;
    generateTestConfirmationUrl: () => any;
  }
}

export async function testConfirmationUrl(url: string) {
  console.log('🔍 TESTING CONFIRMATION URL:', url);
  
  try {
    const urlObj = new URL(url);
    const params = {
      code: urlObj.searchParams.get('code'),
      token_hash: urlObj.searchParams.get('token_hash'),
      type: urlObj.searchParams.get('type'),
      email: urlObj.searchParams.get('email'),
      error: urlObj.searchParams.get('error'),
      error_code: urlObj.searchParams.get('error_code'),
      error_description: urlObj.searchParams.get('error_description')
    };
    
    console.log('🔍 URL PARAMETERS:', params);
    
    // Check which flow this is
    if (params.code) {
      console.log('🔍 DETECTED: Implicit flow (code parameter)');
    } else if (params.token_hash && params.type) {
      console.log('🔍 DETECTED: PKCE flow (token_hash + type)');
    } else {
      console.log('🔍 ERROR: Missing required parameters');
      console.log('Expected: code OR (token_hash + type)');
      return { success: false, error: 'Missing required parameters' };
    }
    
    // Test the actual verification
    if (params.code) {
      console.log('🔍 Testing implicit flow verification...');
      const result = await supabase.auth.exchangeCodeForSession(params.code);
      console.log('🔍 Implicit flow result:', { 
        success: !result.error, 
        error: result.error?.message,
        hasUser: !!result.data?.user,
        hasSession: !!result.data?.session
      });
      return result;
    } else if (params.token_hash && params.type) {
      console.log('🔍 Testing PKCE flow verification...');
      const result = await supabase.auth.verifyOtp({
        token_hash: params.token_hash,
        type: params.type as any,
        email: params.email || undefined
      });
      console.log('🔍 PKCE flow result:', { 
        success: !result.error, 
        error: result.error?.message,
        hasUser: !!result.data?.user,
        hasSession: !!result.data?.session
      });
      return result;
    }
    
  } catch (error) {
    console.error('🔍 URL TEST ERROR:', error);
    return { success: false, error: error.message };
  }
}

// Test function to generate a sample confirmation URL
export function generateTestConfirmationUrl() {
  const baseUrl = 'https://dislinkboltv2duplicate.netlify.app';
  
  // Test implicit flow URL
  const implicitUrl = `${baseUrl}/?code=test_code_123&email=test@example.com`;
  
  // Test PKCE flow URL  
  const pkceUrl = `${baseUrl}/?token_hash=test_hash_123&type=signup&email=test@example.com`;
  
  // Test with /confirmed path (what we expect after Netlify redirects)
  const confirmedImplicitUrl = `${baseUrl}/confirmed?code=test_code_123&email=test@example.com`;
  const confirmedPkceUrl = `${baseUrl}/confirmed?token_hash=test_hash_123&type=signup&email=test@example.com`;
  
  console.log('🔍 SAMPLE IMPLICIT URL:', implicitUrl);
  console.log('🔍 SAMPLE PKCE URL:', pkceUrl);
  console.log('🔍 SAMPLE CONFIRMED IMPLICIT URL:', confirmedImplicitUrl);
  console.log('🔍 SAMPLE CONFIRMED PKCE URL:', confirmedPkceUrl);
  
  return { implicitUrl, pkceUrl, confirmedImplicitUrl, confirmedPkceUrl };
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  window.testConfirmationUrl = async (url?: string) => {
    const testUrl = url || window.location.href;
    return await testConfirmationUrl(testUrl);
  };
  
  window.generateTestConfirmationUrl = generateTestConfirmationUrl;
  
  console.log('🔍 Confirmation URL test utilities loaded!');
  console.log('🔍 Use window.testConfirmationUrl() to test current URL');
  console.log('🔍 Use window.generateTestConfirmationUrl() to see sample URLs');
}
