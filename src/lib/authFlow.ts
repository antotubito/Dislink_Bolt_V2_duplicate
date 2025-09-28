// Enhanced authentication flow management
import { supabase } from './supabase';
import { logger } from './logger';
import { updateProfile } from './profile';
import type { User } from '../types/user';

export interface AuthFlowResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
  requiresOnboarding?: boolean;
  alreadyVerified?: boolean;
}

/**
 * Handle email confirmation with automatic login and proper flow management
 */
export async function handleEmailConfirmation(url: string): Promise<AuthFlowResult> {
  try {
    logger.info('🔐 Starting email confirmation flow', { url });

    // Extract parameters from URL
    const urlObj = new URL(url);
    const tokenHash = urlObj.searchParams.get('token_hash');
    const type = urlObj.searchParams.get('type');
    const email = urlObj.searchParams.get('email');

    if (!tokenHash || !type) {
      throw new Error('Missing required parameters in confirmation URL');
    }

    logger.info('🔐 Confirmation parameters', { 
      hasTokenHash: !!tokenHash, 
      type, 
      hasEmail: !!email 
    });

    // Attempt email confirmation
    let verificationResult;
    
    if (email) {
      // Try with email first (more reliable)
      logger.info('🔐 Attempting verification with email');
      verificationResult = await supabase.auth.verifyOtp({
        email,
        token_hash: tokenHash,
        type: type as any
      });
    } else {
      // Fallback to token_hash only
      logger.info('🔐 Attempting verification with token_hash only');
      verificationResult = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any
      });
    }

    const { data, error } = verificationResult;

    if (error) {
      logger.warn('🔐 Verification error:', error);

      // Handle specific error cases
      if (error.message?.includes('User already confirmed') || 
          error.message?.includes('already been confirmed')) {
        logger.info('🔐 User already confirmed, checking session');
        
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          return {
            success: true,
            user: session.user,
            session,
            alreadyVerified: true,
            requiresOnboarding: await checkOnboardingStatus(session.user.id)
          };
        } else {
          // User is verified but not logged in, redirect to login
          return {
            success: true,
            alreadyVerified: true,
            requiresOnboarding: false
          };
        }
      }

      if (error.message?.includes('rate limit') || error.message?.includes('security purposes')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }

      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        throw new Error('This confirmation link has expired or is invalid. Please request a new confirmation email.');
      }

      throw error;
    }

    if (!data.user || !data.session) {
      throw new Error('Email confirmation failed. Please try again.');
    }

    logger.info('🔐 Email confirmation successful', { 
      userId: data.user.id,
      email: data.user.email 
    });

    // Check onboarding status
    const requiresOnboarding = await checkOnboardingStatus(data.user.id);

    return {
      success: true,
      user: data.user,
      session: data.session,
      requiresOnboarding
    };

  } catch (error) {
    logger.error('🔐 Email confirmation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email confirmation failed'
    };
  }
}

/**
 * Check if user needs onboarding
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', userId)
      .single();

    if (error) {
      logger.warn('🔐 Could not check onboarding status:', error);
      // If we can't check, assume onboarding is needed for safety
      return true;
    }

    return !profile?.onboarding_complete;
  } catch (error) {
    logger.error('🔐 Error checking onboarding status:', error);
    return true;
  }
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(userId: string, userData: Partial<User>): Promise<void> {
  try {
    logger.info('🎯 Completing onboarding for user:', userId);

    await updateProfile({
      ...userData,
      onboardingComplete: true,
      onboardingCompletedAt: new Date()
    });

    logger.info('✅ Onboarding completed successfully');
  } catch (error) {
    logger.error('❌ Failed to complete onboarding:', error);
    throw error;
  }
}

/**
 * Get the correct redirect URL for email confirmations
 */
export function getEmailRedirectUrl(): string {
  // In production, use the production URL
  if (window.location.hostname === 'dislinkboltv2duplicate.netlify.app') {
    return 'https://dislinkboltv2duplicate.netlify.app/confirmed';
  }
  
  // In development, use localhost
  return `${window.location.origin}/confirmed`;
}

/**
 * Enhanced auth state change handler
 */
export function setupAuthStateListener(
  onAuthChange: (event: string, session: any) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      logger.info('🔐 Auth state changed:', { event, hasSession: !!session });
      
      // Handle specific events
      if (event === 'SIGNED_IN' && session) {
        logger.info('🔐 User signed in:', { userId: session.user.id });
      } else if (event === 'SIGNED_OUT') {
        logger.info('🔐 User signed out');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        logger.info('🔐 Token refreshed');
      }

      onAuthChange(event, session);
    }
  );

  return () => subscription.unsubscribe();
}

/**
 * Check if user should be redirected to onboarding
 */
export function shouldRedirectToOnboarding(
  user: any,
  currentPath: string
): boolean {
  // Don't redirect if already on onboarding
  if (currentPath === '/app/onboarding') {
    return false;
  }

  // Don't redirect if on public paths
  const publicPaths = [
    '/',
    '/waitlist',
    '/story',
    '/app/login',
    '/app/register',
    '/app/reset-password',
    '/app/terms',
    '/app/test-terms',
    '/terms',
    '/privacy',
    '/verify',
    '/confirm',
    '/confirmed',
    '/demo'
  ];

  if (publicPaths.some(path => currentPath === path || currentPath.startsWith(`${path}/`))) {
    return false;
  }

  // Check if user needs onboarding
  return user && !user.onboardingComplete;
}

/**
 * Get the appropriate redirect path after authentication
 */
export function getPostAuthRedirectPath(
  user: any,
  storedRedirectUrl?: string
): string {
  // If user needs onboarding, go to onboarding
  if (shouldRedirectToOnboarding(user, '/app')) {
    return '/app/onboarding';
  }

  // If there's a stored redirect URL and it's valid, use it
  if (storedRedirectUrl && 
      storedRedirectUrl.startsWith('/app') && 
      storedRedirectUrl !== '/app/onboarding') {
    return storedRedirectUrl;
  }

  // Default to home
  return '/app';
}
