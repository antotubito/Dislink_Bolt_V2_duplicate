import { supabase } from './supabase';
import { logger } from './logger';

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date;
  error?: string;
}

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  keyPrefix: string;
}

// Default rate limiting configurations
export const RATE_LIMIT_CONFIGS = {
  REGISTRATION: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'registration_attempts'
  },
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'login_attempts'
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'password_reset_attempts'
  },
  EMAIL_RESEND: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'email_resend_attempts'
  }
} as const;

/**
 * Check if an action is allowed based on rate limiting rules
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const key = `${config.keyPrefix}:${identifier}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Get current attempts from database
    const { data: attempts, error } = await supabase
      .from('rate_limiting')
      .select('*')
      .eq('key', key)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Rate limiting check error:', error);
      // Fail open - allow the request if we can't check rate limits
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetTime: new Date(now.getTime() + config.windowMs)
      };
    }

    const attemptCount = attempts?.length || 0;
    const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount);
    const allowed = attemptCount < config.maxAttempts;

    // Calculate reset time (when the oldest attempt in the window expires)
    let resetTime = new Date(now.getTime() + config.windowMs);
    if (attempts && attempts.length > 0) {
      const oldestAttempt = attempts[attempts.length - 1];
      resetTime = new Date(new Date(oldestAttempt.created_at).getTime() + config.windowMs);
    }

    logger.info('Rate limit check:', {
      key,
      attemptCount,
      remainingAttempts,
      allowed,
      resetTime
    });

    return {
      allowed,
      remainingAttempts,
      resetTime,
      error: !allowed ? `Rate limit exceeded. Try again after ${resetTime.toLocaleString()}` : undefined
    };

  } catch (error) {
    logger.error('Rate limiting check failed:', error);
    // Fail open - allow the request if we can't check rate limits
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts,
      resetTime: new Date(Date.now() + config.windowMs)
    };
  }
}

/**
 * Record an attempt for rate limiting
 */
export async function recordRateLimitAttempt(
  identifier: string,
  config: RateLimitConfig,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const key = `${config.keyPrefix}:${identifier}`;

    await supabase
      .from('rate_limiting')
      .insert({
        key,
        identifier,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      });

    logger.info('Rate limit attempt recorded:', { key, identifier });

  } catch (error) {
    logger.error('Failed to record rate limit attempt:', error);
    // Don't throw - rate limiting is not critical enough to fail the main operation
  }
}

/**
 * Clear rate limiting attempts for an identifier
 */
export async function clearRateLimitAttempts(
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  try {
    const key = `${config.keyPrefix}:${identifier}`;

    await supabase
      .from('rate_limiting')
      .delete()
      .eq('key', key);

    logger.info('Rate limit attempts cleared:', { key, identifier });

  } catch (error) {
    logger.error('Failed to clear rate limit attempts:', error);
  }
}

/**
 * Get rate limiting status for an identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, config);
}

/**
 * Format rate limit error message for user display
 */
export function formatRateLimitError(result: RateLimitResult): string {
  if (result.allowed) {
    return '';
  }

  const resetTime = new Date(result.resetTime);
  const now = new Date();
  const timeUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);

  if (timeUntilReset < 60) {
    return `Too many attempts. Please wait ${timeUntilReset} seconds before trying again.`;
  } else if (timeUntilReset < 3600) {
    const minutes = Math.ceil(timeUntilReset / 60);
    return `Too many attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
  } else {
    const hours = Math.ceil(timeUntilReset / 3600);
    return `Too many attempts. Please wait ${hours} hour${hours > 1 ? 's' : ''} before trying again.`;
  }
}
