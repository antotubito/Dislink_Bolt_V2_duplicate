import { logger } from './logger';
import Cookies from 'js-cookie';

class SessionManager {
  private static instance: SessionManager;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    // Initialize session check interval
    setInterval(() => this.checkSessionExpiry(), 60000); // Check every minute
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Store session
  storeSession(token: string): void {
    try {
      const expiresAt = Date.now() + this.SESSION_DURATION;
      
      // Store session data
      localStorage.setItem('sb-token', token);
      localStorage.setItem('session_expires_at', expiresAt.toString());
      
      logger.info('Session stored successfully');
    } catch (error) {
      logger.error('Failed to store session:', error);
    }
  }

  // Store testing session with specific token
  storeTestingSession(token: string): void {
    try {
      const expiresAt = Date.now() + this.SESSION_DURATION;
      
      // Store both production-style and testing-style tokens
      localStorage.setItem('auth_token', token);
      localStorage.setItem('session_expires_at', expiresAt.toString());
      
      logger.info('Testing session stored successfully');
    } catch (error) {
      logger.error('Failed to store testing session:', error);
    }
  }

  // Check if session exists and is valid
  hasSession(): boolean {
    try {
      const token = localStorage.getItem('sb-token');
      
      if (!token) return false;
      
      const expiresAt = localStorage.getItem('session_expires_at');
      if (!expiresAt) return false;
      
      const expirationTime = parseInt(expiresAt);
      const now = Date.now();
      
      if (now >= expirationTime) {
        logger.info('Session expired, clearing');
        this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking session:', error);
      return false;
    }
  }

  // Get stored session token
  getSessionToken(): string | null {
    try {
      if (!this.hasSession()) return null;
      return localStorage.getItem('sb-token');
    } catch (error) {
      logger.error('Error getting session token:', error);
      return null;
    }
  }

  // Clear all session data
  clearSession(): void {
    try {
      // Clear all possible session storage locations
      localStorage.removeItem('sb-token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('session_expires_at');
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockoutUntil');
      localStorage.removeItem('redirectUrl');
      
      // Clear cookies
      Cookies.remove('auth_token');
      Cookies.remove('session_id');
      
      logger.info('Session cleared successfully');
    } catch (error) {
      logger.error('Error clearing session:', error);
    }
  }

  // Login attempt tracking
  recordFailedLogin(): boolean {
    try {
      const attempts = Number(localStorage.getItem('loginAttempts') || '0') + 1;
      localStorage.setItem('loginAttempts', attempts.toString());
      
      if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
        localStorage.setItem('loginLockoutUntil', lockoutUntil.toString());
        logger.warn(`Account locked out after ${attempts} failed attempts`);
        return true; // Account is locked
      }
      
      logger.info(`Failed login attempt ${attempts}/${this.MAX_LOGIN_ATTEMPTS}`);
      return false; // Not locked yet
    } catch (error) {
      logger.error('Error recording failed login:', error);
      return false;
    }
  }

  // Clear login attempts on successful login
  clearLoginAttempts(): void {
    try {
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockoutUntil');
      logger.info('Login attempts cleared');
    } catch (error) {
      logger.error('Error clearing login attempts:', error);
    }
  }

  // Check if account is currently locked out
  isLockedOut(): boolean {
    try {
      const lockoutUntil = localStorage.getItem('loginLockoutUntil');
      if (!lockoutUntil) return false;
      
      const lockoutTime = parseInt(lockoutUntil);
      const now = Date.now();
      
      if (now >= lockoutTime) {
        // Lockout period has expired
        this.clearLoginAttempts();
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking lockout status:', error);
      return false;
    }
  }

  // Get remaining lockout time in minutes
  getRemainingLockoutTime(): number {
    try {
      const lockoutUntil = localStorage.getItem('loginLockoutUntil');
      if (!lockoutUntil) return 0;
      
      const lockoutTime = parseInt(lockoutUntil);
      const now = Date.now();
      const remaining = Math.max(0, lockoutTime - now);
      
      return Math.ceil(remaining / 60000); // Convert to minutes
    } catch (error) {
      logger.error('Error getting remaining lockout time:', error);
      return 0;
    }
  }

  // Store redirect URL for post-login navigation
  storeRedirectUrl(url: string): void {
    try {
      localStorage.setItem('redirectUrl', url);
    } catch (error) {
      logger.error('Error storing redirect URL:', error);
    }
  }

  // Get and clear redirect URL
  getAndClearRedirectUrl(): string | null {
    try {
      const url = localStorage.getItem('redirectUrl');
      localStorage.removeItem('redirectUrl');
      return url;
    } catch (error) {
      logger.error('Error getting redirect URL:', error);
      return null;
    }
  }

  // Get login attempt count
  getLoginAttempts(): number {
    try {
      const attempts = Number(localStorage.getItem('loginAttempts') || '0');
      return attempts;
    } catch (error) {
      logger.error('Error getting login attempts:', error);
      return 0;
    }
  }

  // Check session expiry
  private checkSessionExpiry(): void {
    try {
      const expiresAt = localStorage.getItem('session_expires_at');
      if (!expiresAt) return;
      
      const expirationTime = parseInt(expiresAt);
      const now = Date.now();
      
      // If session is expired, clear it
      if (now >= expirationTime) {
        logger.info('Session expired during background check');
        this.clearSession();
        
        // Optionally trigger a logout event
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }
    } catch (error) {
      logger.error('Error during session expiry check:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();