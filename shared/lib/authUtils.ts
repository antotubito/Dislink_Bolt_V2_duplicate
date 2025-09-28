import { supabase } from './supabase';
import { logger } from './logger';

// PKCE (Proof Key for Code Exchange) utilities for secure email verification
export class PKCEUtils {
  private static readonly CODE_VERIFIER_KEY = 'supabase_code_verifier';
  private static readonly CODE_CHALLENGE_KEY = 'supabase_code_challenge';

  // Generate a cryptographically secure random string
  private static generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }

  // Generate code verifier (43-128 characters)
  static generateCodeVerifier(): string {
    return this.generateRandomString(128);
  }

  // Generate code challenge from verifier using SHA256
  static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Store code verifier securely (localStorage for persistence across tabs)
  static storeCodeVerifier(verifier: string): void {
    try {
      // Store in localStorage for persistence across tabs/windows
      localStorage.setItem(this.CODE_VERIFIER_KEY, verifier);
      // Also store in sessionStorage as backup
      sessionStorage.setItem(this.CODE_VERIFIER_KEY, verifier);
      // Store with timestamp for debugging
      localStorage.setItem(`${this.CODE_VERIFIER_KEY}_timestamp`, Date.now().toString());
      logger.info('Code verifier stored securely in localStorage and sessionStorage', {
        verifierLength: verifier.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to store code verifier:', error);
    }
  }

  // Retrieve code verifier (try localStorage first, then sessionStorage)
  static getCodeVerifier(): string | null {
    try {
      // Try localStorage first (persists across tabs)
      let verifier = localStorage.getItem(this.CODE_VERIFIER_KEY);
      if (verifier) {
        const timestamp = localStorage.getItem(`${this.CODE_VERIFIER_KEY}_timestamp`);
        logger.info('Code verifier retrieved from localStorage', {
          verifierLength: verifier.length,
          timestamp: timestamp ? new Date(parseInt(timestamp)).toISOString() : 'unknown'
        });
        return verifier;
      }

      // Fallback to sessionStorage
      verifier = sessionStorage.getItem(this.CODE_VERIFIER_KEY);
      if (verifier) {
        logger.info('Code verifier retrieved from sessionStorage', {
          verifierLength: verifier.length
        });
        return verifier;
      }

      logger.warn('No code verifier found in storage', {
        localStorageKeys: Object.keys(localStorage).filter(k => k.includes('supabase')),
        sessionStorageKeys: Object.keys(sessionStorage).filter(k => k.includes('supabase'))
      });
      return null;
    } catch (error) {
      logger.error('Failed to retrieve code verifier:', error);
      return null;
    }
  }

  // Clear stored code verifier
  static clearCodeVerifier(): void {
    try {
      localStorage.removeItem(this.CODE_VERIFIER_KEY);
      sessionStorage.removeItem(this.CODE_VERIFIER_KEY);
      sessionStorage.removeItem(this.CODE_CHALLENGE_KEY);
      logger.info('Code verifier cleared from all storage');
    } catch (error) {
      logger.error('Failed to clear code verifier:', error);
    }
  }
}

// Enhanced email redirect URL generation
export function getEmailRedirectUrl(): string {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${baseUrl}/confirmed`;
}

// Enhanced registration with PKCE support
export async function registerWithPKCE(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ user: any; session: any; error: any; success: boolean }> {
  try {
    logger.info('🔐 Starting PKCE-enabled registration for:', userData.email);

    // Generate PKCE parameters
    const codeVerifier = PKCEUtils.generateCodeVerifier();
    const codeChallenge = await PKCEUtils.generateCodeChallenge(codeVerifier);

    // Store code verifier for later use
    PKCEUtils.storeCodeVerifier(codeVerifier);

    // Get redirect URL
    const redirectUrl = getEmailRedirectUrl();

    logger.info('🔐 PKCE parameters generated:', {
      hasCodeVerifier: !!codeVerifier,
      hasCodeChallenge: !!codeChallenge,
      redirectUrl
    });

    // Attempt sign up with PKCE
    const { data, error } = await supabase.auth.signUp({
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      options: {
        data: {
          firstName: userData.firstName.trim(),
          lastName: userData.lastName.trim(),
          full_name: `${userData.firstName.trim()} ${userData.lastName.trim()}`
        },
        emailRedirectTo: redirectUrl,
        codeChallenge: codeChallenge,
        codeChallengeMethod: 'S256'
      }
    });

    if (error) {
      logger.error('Registration failed:', error);
      PKCEUtils.clearCodeVerifier(); // Clear on error
      return {
        user: null,
        session: null,
        error,
        success: false
      };
    }

    logger.info('✅ Registration successful, confirmation email sent');
    return {
      user: data.user,
      session: data.session,
      error: null,
      success: true
    };

  } catch (err: any) {
    logger.error('Registration error:', err);
    PKCEUtils.clearCodeVerifier(); // Clear on error
    return {
      user: null,
      session: null,
      error: err,
      success: false
    };
  }
}

// Enhanced email verification with PKCE
export async function verifyEmailWithPKCE(url: string): Promise<{
  user: any;
  session: any;
  error: any;
  success: boolean;
}> {
  try {
    logger.info('🔐 Starting PKCE-enabled email verification', { url });

    // Get stored code verifier
    const codeVerifier = PKCEUtils.getCodeVerifier();

    if (!codeVerifier) {
      logger.warn('No code verifier found, attempting standard verification');
      // Fallback to standard verification without PKCE
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);

        if (error) {
          logger.error('Standard verification failed:', error);
          return { user: null, session: null, error, success: false };
        }

        logger.info('✅ Standard email verification successful (no PKCE)');
        return { user: data.user, session: data.session, error: null, success: true };
      } catch (err: any) {
        logger.error('Standard verification error:', err);
        return { user: null, session: null, error: err, success: false };
      }
    }

    logger.info('🔐 Using stored code verifier for verification', {
      hasCodeVerifier: !!codeVerifier,
      codeVerifierLength: codeVerifier.length
    });

    // Extract code from URL
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');

    if (!code) {
      const error = new Error('No verification code found in URL');
      logger.error('Verification failed:', error);
      return { user: null, session: null, error, success: false };
    }

    logger.info('🔐 Attempting PKCE verification', {
      hasCode: !!code,
      codeLength: code.length,
      hasCodeVerifier: !!codeVerifier
    });

    // Exchange code for session with PKCE
    const { data, error } = await supabase.auth.exchangeCodeForSession(code, codeVerifier);

    if (error) {
      logger.error('PKCE verification failed:', error);

      // If PKCE fails, try standard verification as fallback
      logger.info('🔄 PKCE failed, attempting standard verification as fallback');
      try {
        const { data: fallbackData, error: fallbackError } = await supabase.auth.exchangeCodeForSession(url);

        if (fallbackError) {
          logger.error('Fallback verification also failed:', fallbackError);
          return { user: null, session: null, error, success: false };
        }

        logger.info('✅ Fallback verification successful');
        PKCEUtils.clearCodeVerifier(); // Clear anyway
        return { user: fallbackData.user, session: fallbackData.session, error: null, success: true };
      } catch (fallbackErr: any) {
        logger.error('Fallback verification error:', fallbackErr);
        return { user: null, session: null, error, success: false };
      }
    }

    // Clear code verifier after successful verification
    PKCEUtils.clearCodeVerifier();

    logger.info('✅ PKCE email verification successful');
    return { user: data.user, session: data.session, error: null, success: true };

  } catch (err: any) {
    logger.error('Email verification error:', err);
    return { user: null, session: null, error: err, success: false };
  }
}

// Utility to check if user has minimum required profile information
export function validateUserProfile(user: any): {
  isValid: boolean;
  missingFields: string[];
  recommendations: string[];
} {
  const missingFields: string[] = [];
  const recommendations: string[] = [];

  // Required fields (minimum 1)
  const requiredFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' }
  ];

  // Recommended fields (at least 3 total)
  const recommendedFields = [
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'company', label: 'Company' },
    { key: 'bio', label: 'Bio' },
    { key: 'location', label: 'Location' },
    { key: 'socialLinks', label: 'Social Links' }
  ];

  // Check required fields
  requiredFields.forEach(field => {
    if (!user?.[field.key] || user[field.key].trim() === '') {
      missingFields.push(field.label);
    }
  });

  // Check recommended fields
  recommendedFields.forEach(field => {
    if (!user?.[field.key] ||
      (typeof user[field.key] === 'string' && user[field.key].trim() === '') ||
      (typeof user[field.key] === 'object' && Object.keys(user[field.key] || {}).length === 0)) {
      recommendations.push(field.label);
    }
  });

  const totalFields = requiredFields.length + recommendedFields.length;
  const completedFields = totalFields - missingFields.length - recommendations.length;
  const hasMinimum = completedFields >= 1;
  const hasRecommended = completedFields >= 3;

  return {
    isValid: hasMinimum,
    missingFields,
    recommendations: hasRecommended ? [] : recommendations
  };
}