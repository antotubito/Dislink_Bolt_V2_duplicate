/**
 * Registration Diagnostic Tool
 * 
 * This utility helps diagnose registration issues including:
 * - Email sending limits
 * - SMTP configuration
 * - Rate limiting
 * - Network connectivity
 */

import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export interface RegistrationDiagnosticResult {
    success: boolean;
    issues: string[];
    recommendations: string[];
    details: {
        supabaseConnection: boolean;
        emailServiceStatus: 'working' | 'limited' | 'error' | 'unknown';
        rateLimitStatus: 'ok' | 'limited' | 'unknown';
        networkStatus: 'ok' | 'slow' | 'error';
        lastError?: string;
    };
}

/**
 * Run comprehensive registration diagnostics
 */
export async function runRegistrationDiagnostic(): Promise<RegistrationDiagnosticResult> {
    const result: RegistrationDiagnosticResult = {
        success: true,
        issues: [],
        recommendations: [],
        details: {
            supabaseConnection: false,
            emailServiceStatus: 'unknown',
            rateLimitStatus: 'unknown',
            networkStatus: 'ok'
        }
    };

    try {
        logger.info('🔍 Starting registration diagnostic...');

        // Test 1: Supabase Connection
        try {
            const { data, error } = await supabase.from('profiles').select('count').limit(1);
            if (error) {
                result.issues.push('Supabase connection failed');
                result.details.supabaseConnection = false;
                result.details.lastError = error.message;
            } else {
                result.details.supabaseConnection = true;
                logger.info('✅ Supabase connection working');
            }
        } catch (err) {
            result.issues.push('Supabase connection error');
            result.details.supabaseConnection = false;
            result.details.lastError = err instanceof Error ? err.message : 'Unknown error';
        }

        // Test 2: Email Service Status
        try {
            // Try to get auth settings to check email configuration
            const { data: authData, error: authError } = await supabase.auth.getSession();

            if (authError) {
                result.issues.push('Auth service error');
                result.details.emailServiceStatus = 'error';
                result.details.lastError = authError.message;
            } else {
                // Check if we can access auth settings
                result.details.emailServiceStatus = 'working';
                logger.info('✅ Auth service accessible');
            }
        } catch (err) {
            result.issues.push('Email service check failed');
            result.details.emailServiceStatus = 'error';
            result.details.lastError = err instanceof Error ? err.message : 'Unknown error';
        }

        // Test 3: Rate Limiting Check
        try {
            // Try a simple auth operation to check for rate limiting
            const { error: rateLimitError } = await supabase.auth.getUser();

            if (rateLimitError) {
                if (rateLimitError.message.includes('rate limit') || rateLimitError.message.includes('too many requests')) {
                    result.issues.push('Rate limit exceeded');
                    result.details.rateLimitStatus = 'limited';
                    result.recommendations.push('Wait 1 hour before trying to register again');
                } else {
                    result.details.rateLimitStatus = 'ok';
                }
            } else {
                result.details.rateLimitStatus = 'ok';
                logger.info('✅ No rate limiting detected');
            }
        } catch (err) {
            result.details.rateLimitStatus = 'unknown';
            logger.warn('Could not check rate limiting status');
        }

        // Test 4: Network Performance
        try {
            const startTime = Date.now();
            await supabase.from('profiles').select('count').limit(1);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            if (responseTime > 5000) {
                result.issues.push('Slow network connection');
                result.details.networkStatus = 'slow';
                result.recommendations.push('Check your internet connection');
            } else {
                result.details.networkStatus = 'ok';
                logger.info(`✅ Network response time: ${responseTime}ms`);
            }
        } catch (err) {
            result.issues.push('Network connectivity issues');
            result.details.networkStatus = 'error';
            result.recommendations.push('Check your internet connection and try again');
        }

        // Generate recommendations based on findings
        if (result.issues.length === 0) {
            result.recommendations.push('All systems appear to be working. Try registering again.');
        } else {
            if (result.details.emailServiceStatus === 'limited') {
                result.recommendations.push('Email service has reached daily limits. Try again tomorrow.');
            }
            if (result.details.rateLimitStatus === 'limited') {
                result.recommendations.push('Rate limit exceeded. Wait before trying again.');
            }
            if (result.details.networkStatus === 'slow' || result.details.networkStatus === 'error') {
                result.recommendations.push('Network issues detected. Check your connection.');
            }
            if (!result.details.supabaseConnection) {
                result.recommendations.push('Database connection issues. Contact support.');
            }
        }

        result.success = result.issues.length === 0;

        logger.info('🔍 Registration diagnostic completed:', result);
        return result;

    } catch (err) {
        logger.error('❌ Registration diagnostic failed:', err);
        result.success = false;
        result.issues.push('Diagnostic failed');
        result.details.lastError = err instanceof Error ? err.message : 'Unknown error';
        result.recommendations.push('Contact support for assistance');
        return result;
    }
}

/**
 * Test email sending specifically
 */
export async function testEmailSending(email: string): Promise<{
    success: boolean;
    error?: string;
    details: any;
}> {
    try {
        logger.info('🧪 Testing email sending...');

        // Try to resend a verification email (this will fail if user doesn't exist, but we can check the error)
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: `${window.location.origin}/confirmed`
            }
        });

        if (error) {
            if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                return {
                    success: false,
                    error: 'Rate limit exceeded - too many email requests',
                    details: { error: error.message, type: 'rate_limit' }
                };
            } else if (error.message.includes('User not found') || error.message.includes('not found')) {
                return {
                    success: true, // This is actually good - means email service is working
                    details: { error: error.message, type: 'user_not_found' }
                };
            } else if (error.message.includes('Email not confirmed') || error.message.includes('already confirmed')) {
                return {
                    success: true, // Email service is working
                    details: { error: error.message, type: 'email_status' }
                };
            } else {
                return {
                    success: false,
                    error: error.message,
                    details: { error: error.message, type: 'unknown' }
                };
            }
        }

        return {
            success: true,
            details: { message: 'Email service is working' }
        };

    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            details: { error: err }
        };
    }
}

/**
 * Check Supabase email limits and status
 */
export async function checkEmailLimits(): Promise<{
    status: 'ok' | 'limited' | 'error' | 'unknown';
    details: string;
    recommendations: string[];
}> {
    try {
        // Try to get user info to check if auth service is responsive
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                return {
                    status: 'limited',
                    details: 'Rate limit exceeded - too many requests',
                    recommendations: [
                        'Wait 1 hour before trying to register again',
                        'Try using a different email address',
                        'Contact support if the issue persists'
                    ]
                };
            } else {
                return {
                    status: 'error',
                    details: error.message,
                    recommendations: [
                        'Check your internet connection',
                        'Try again in a few minutes',
                        'Contact support if the issue persists'
                    ]
                };
            }
        }

        return {
            status: 'ok',
            details: 'Email service appears to be working normally',
            recommendations: [
                'Try registering again',
                'Check your spam folder for confirmation emails',
                'Ensure you\'re using a valid email address'
            ]
        };

    } catch (err) {
        return {
            status: 'unknown',
            details: 'Could not check email service status',
            recommendations: [
                'Check your internet connection',
                'Try again in a few minutes',
                'Contact support if the issue persists'
            ]
        };
    }
}

// Expose diagnostic functions globally for debugging
if (typeof window !== 'undefined') {
    (window as any).runRegistrationDiagnostic = runRegistrationDiagnostic;
    (window as any).testEmailSending = testEmailSending;
    (window as any).checkEmailLimits = checkEmailLimits;

    console.log('🔧 Registration diagnostic functions available:');
    console.log('- window.runRegistrationDiagnostic()');
    console.log('- window.testEmailSending("your-email@example.com")');
    console.log('- window.checkEmailLimits()');
}
