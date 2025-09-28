/**
 * Email Confirmation Test Utility
 * 
 * This utility helps debug email confirmation issues
 */

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export interface EmailConfirmationTestResult {
    success: boolean;
    error?: string;
    debugInfo: {
        hasCode: boolean;
        hasToken: boolean;
        hasEmail: boolean;
        url: string;
        allParams: Record<string, string>;
        sessionStatus: 'none' | 'valid' | 'invalid';
        userStatus?: {
            exists: boolean;
            confirmed: boolean;
            emailConfirmedAt?: string;
        };
    };
}

/**
 * Test email confirmation with a given code
 */
export async function testEmailConfirmation(code: string): Promise<EmailConfirmationTestResult> {
    const debugInfo: EmailConfirmationTestResult['debugInfo'] = {
        hasCode: !!code,
        hasToken: false,
        hasEmail: false,
        url: window.location.href,
        allParams: {},
        sessionStatus: 'none'
    };

    try {
        logger.info('🧪 Testing email confirmation with code:', code.substring(0, 5) + '...');

        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        debugInfo.sessionStatus = session ? 'valid' : 'none';

        // Try to exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            logger.error('❌ Code exchange failed:', error);

            // Check if user exists and is already confirmed
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    debugInfo.userStatus = {
                        exists: true,
                        confirmed: !!user.email_confirmed_at,
                        emailConfirmedAt: user.email_confirmed_at || undefined
                    };
                }
            } catch (userError) {
                logger.warn('Could not check user status:', userError);
            }

            return {
                success: false,
                error: error.message,
                debugInfo
            };
        }

        if (data.session) {
            logger.info('✅ Code exchange successful');
            debugInfo.sessionStatus = 'valid';

            return {
                success: true,
                debugInfo
            };
        }

        return {
            success: false,
            error: 'No session created',
            debugInfo
        };

    } catch (err) {
        logger.error('❌ Email confirmation test failed:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            debugInfo
        };
    }
}

/**
 * Test if a user can be found by email
 */
export async function testUserLookup(email: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
}> {
    try {
        logger.info('🧪 Testing user lookup for:', email.substring(0, 5) + '...');

        // Try to get user info
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            return {
                success: false,
                error: error.message
            };
        }

        if (user && user.email === email) {
            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    emailConfirmedAt: user.email_confirmed_at,
                    createdAt: user.created_at
                }
            };
        }

        return {
            success: false,
            error: 'User not found or email mismatch'
        };

    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}

// Expose test functions globally for debugging
if (typeof window !== 'undefined') {
    (window as any).testEmailConfirmation = testEmailConfirmation;
    (window as any).testUserLookup = testUserLookup;

    console.log('🧪 Email confirmation test functions available:');
    console.log('- window.testEmailConfirmation(code)');
    console.log('- window.testUserLookup(email)');
}
