/**
 * Security utilities for the Dislink application
 * Provides functions for secure error handling, input sanitization, and security checks
 */

import { captureMessage } from '@dislink/shared/lib/sentry';

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (import.meta.env.PROD) {
    return "An unexpected error occurred. Please try again.";
  }
  
  // In development, extract the message from Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;

  // Check for malicious content first
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<[^>]*>/i
  ];
  
  if (maliciousPatterns.some(pattern => pattern.test(email))) {
    return null; // Reject malicious emails
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(email.trim())) {
    return email.trim();
  }
  return null;
}

/**
 * Check if the current environment is secure
 */
export function isSecureEnvironment(): boolean {
  // Handle cases where window or window.location might be undefined (e.g., in test environments)
  if (typeof window === 'undefined' || !window.location) {
    return false; // Default to insecure in server-side or test environments
  }

  try {
    // Safely extract location properties with fallbacks
    const protocol = window.location?.protocol || '';
    const hostname = window.location?.hostname || '';
    
    // Ensure hostname is a string before calling string methods
    if (typeof hostname !== 'string' || hostname === '') {
      console.warn('Hostname is not a valid string:', typeof hostname, hostname);
      return false;
    }
    
    // Check if running over HTTPS
    const isHttps = protocol === 'https:';
    
    // Check if running on localhost (development)
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    // Check if running on a secure domain (only if hostname is a valid string with includes method)
    const isSecureDomain = hostname && typeof hostname.includes === 'function' && (
      hostname.includes('netlify.app') ||
      hostname.includes('dislink.com') ||
      hostname.includes('dislinkboltv2duplicate.netlify.app')
    );
    
    return isHttps || isLocalhost || isSecureDomain;
  } catch (error) {
    // If there's any error accessing location properties, default to insecure
    console.warn('Error checking environment security:', error);
    return false;
  }
}

/**
 * Log security events securely
 */
export function logSecurityEvent(event: string, details?: Record<string, any>) {
  const sanitizedDetails = details ? sanitizeObject(details) : {};
  
  console.warn(`🔒 Security Event: ${event}`, sanitizedDetails);
  
  // Send to monitoring service
  try {
    captureMessage(`Security Event: ${event}`, 'warning');
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Sanitize objects to remove sensitive data
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  const sensitiveKeys = [
    'password', 'token', 'key', 'secret', 'credential', 'auth', 'jwt', 'bearer',
    'apiKey', 'api_key', 'private', 'internal', 'localhost', 'ip', 'url'
  ];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Rate limiting for security-sensitive operations
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }

  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiters for different operations
export const securityRateLimiter = new RateLimiter(10, 60000); // 10 attempts per minute
export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

/**
 * Validate and sanitize file uploads
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.com$/i,
    /\.js$/i,
    /\.vbs$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

/**
 * Generate secure random strings
 */
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Check for suspicious user behavior
 */
export function detectSuspiciousActivity(userAgent: string, ip?: string): boolean {
  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /php/i
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent('Suspicious user agent detected', { userAgent, ip });
    return true;
  }

  // Check for missing or suspicious user agent
  if (!userAgent || userAgent.length < 10) {
    logSecurityEvent('Missing or suspicious user agent', { userAgent, ip });
    return true;
  }

  return false;
}
