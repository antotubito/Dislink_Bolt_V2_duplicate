import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Enhanced session management utilities for Supabase authentication
 * Ensures sessions persist across refreshes and redirects
 */

export interface SessionInfo {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  expiresAt?: Date;
  lastChecked: Date;
}

class SessionManager {
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly SESSION_WARNING_THRESHOLD = 300000; // 5 minutes before expiry

  /**
   * Initialize session monitoring
   */
  public initialize(): void {
    console.log('🔐 SessionManager: Initializing session monitoring...');
    
    // Check session immediately
    this.checkSession();
    
    // Set up periodic session checks
    this.sessionCheckInterval = setInterval(() => {
      this.checkSession();
    }, this.SESSION_CHECK_INTERVAL);
    
    // Listen for visibility changes to refresh session when tab becomes active
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          console.log('🔐 SessionManager: Tab became visible, checking session...');
          this.checkSession();
        }
      });
    }
  }

  /**
   * Check current session status
   */
  public async checkSession(): Promise<SessionInfo> {
    try {
      console.log('🔐 SessionManager: Checking session status...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 SessionManager: Session check error:', error);
        logger.error('Session check error:', error);
        return {
          isAuthenticated: false,
          lastChecked: new Date()
        };
      }

      const sessionInfo: SessionInfo = {
        isAuthenticated: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : undefined,
        lastChecked: new Date()
      };

      console.log('🔐 SessionManager: Session status:', {
        isAuthenticated: sessionInfo.isAuthenticated,
        userId: sessionInfo.userId,
        email: sessionInfo.email,
        expiresAt: sessionInfo.expiresAt,
        timeUntilExpiry: sessionInfo.expiresAt ? 
          Math.max(0, sessionInfo.expiresAt.getTime() - Date.now()) : undefined
      });

      // Check if session is about to expire
      if (sessionInfo.expiresAt) {
        const timeUntilExpiry = sessionInfo.expiresAt.getTime() - Date.now();
        if (timeUntilExpiry < this.SESSION_WARNING_THRESHOLD && timeUntilExpiry > 0) {
          console.warn('🔐 SessionManager: Session expires soon:', {
            expiresAt: sessionInfo.expiresAt,
            timeUntilExpiry: Math.round(timeUntilExpiry / 1000) + ' seconds'
          });
        }
      }

      return sessionInfo;
    } catch (error) {
      console.error('🔐 SessionManager: Session check failed:', error);
      logger.error('Session check failed:', error);
      return {
        isAuthenticated: false,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Force refresh the session
   */
  public async refreshSession(): Promise<boolean> {
    try {
      console.log('🔐 SessionManager: Refreshing session...');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('🔐 SessionManager: Session refresh error:', error);
        logger.error('Session refresh error:', error);
        return false;
      }

      if (session) {
        console.log('🔐 SessionManager: Session refreshed successfully:', {
          userId: session.user?.id,
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('🔐 SessionManager: Session refresh failed:', error);
      logger.error('Session refresh failed:', error);
      return false;
    }
  }

  /**
   * Get current session info synchronously (from cache)
   */
  public getCurrentSessionInfo(): SessionInfo {
    try {
      // Try to get session from localStorage cache
      const cachedSession = localStorage.getItem('sb-session');
      if (cachedSession) {
        const session = JSON.parse(cachedSession);
        return {
          isAuthenticated: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : undefined,
          lastChecked: new Date()
        };
      }
    } catch (error) {
      console.warn('🔐 SessionManager: Failed to get cached session:', error);
    }

    return {
      isAuthenticated: false,
      lastChecked: new Date()
    };
  }

  /**
   * Clear session and cleanup
   */
  public async clearSession(): Promise<void> {
    try {
      console.log('🔐 SessionManager: Clearing session...');
      
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.removeItem('sb-session');
      localStorage.removeItem('stayLoggedIn');
      localStorage.removeItem('redirectUrl');
      
      console.log('🔐 SessionManager: Session cleared successfully');
    } catch (error) {
      console.error('🔐 SessionManager: Failed to clear session:', error);
      logger.error('Failed to clear session:', error);
    }
  }

  /**
   * Cleanup session manager
   */
  public cleanup(): void {
    console.log('🔐 SessionManager: Cleaning up...');
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Check if user should be redirected to login
   */
  public shouldRedirectToLogin(): boolean {
    const sessionInfo = this.getCurrentSessionInfo();
    
    if (!sessionInfo.isAuthenticated) {
      return true;
    }

    // Check if session is expired
    if (sessionInfo.expiresAt && sessionInfo.expiresAt.getTime() <= Date.now()) {
      console.log('🔐 SessionManager: Session expired, should redirect to login');
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  sessionManager.initialize();
}