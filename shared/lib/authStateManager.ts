import { logger } from './logger';

export interface AuthStateChangeEvent {
  event: string;
  session: any;
  timestamp: number;
}

export interface BackoffConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

export class AuthStateManager {
  private static instance: AuthStateManager;
  private authStateChangeCount = 0;
  private lastAuthStateChange = 0;
  private backoffConfig: BackoffConfig;
  private isProcessing = false;
  private eventQueue: AuthStateChangeEvent[] = [];
  private processingTimeout: NodeJS.Timeout | null = null;

  private constructor(config: BackoffConfig = DEFAULT_BACKOFF_CONFIG) {
    this.backoffConfig = config;
  }

  static getInstance(config?: BackoffConfig): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager(config);
    }
    return AuthStateManager.instance;
  }

  /**
   * Process auth state change with exponential backoff
   */
  async processAuthStateChange(
    event: string,
    session: any,
    handler: (event: string, session: any) => Promise<void> | void
  ): Promise<void> {
    const now = Date.now();
    const timeSinceLastChange = now - this.lastAuthStateChange;
    
    // If too many changes in a short time, apply backoff
    if (this.shouldApplyBackoff(timeSinceLastChange)) {
      logger.warn('Auth state change backoff applied', {
        event,
        changeCount: this.authStateChangeCount,
        timeSinceLastChange,
        backoffDelay: this.getBackoffDelay()
      });

      // Queue the event for later processing
      this.queueEvent(event, session);
      return;
    }

    // Reset counter if enough time has passed
    if (timeSinceLastChange > this.backoffConfig.maxDelay) {
      this.authStateChangeCount = 0;
    }

    // Process the event
    await this.processEvent(event, session, handler);
  }

  /**
   * Check if backoff should be applied
   */
  private shouldApplyBackoff(timeSinceLastChange: number): boolean {
    const windowMs = 10000; // 10 seconds
    const maxChangesInWindow = 5;

    // If too many changes in the time window, apply backoff
    if (timeSinceLastChange < windowMs && this.authStateChangeCount >= maxChangesInWindow) {
      return true;
    }

    return false;
  }

  /**
   * Get the current backoff delay
   */
  private getBackoffDelay(): number {
    const delay = Math.min(
      this.backoffConfig.baseDelay * Math.pow(this.backoffConfig.backoffMultiplier, this.authStateChangeCount),
      this.backoffConfig.maxDelay
    );
    return delay;
  }

  /**
   * Queue an event for later processing
   */
  private queueEvent(event: string, session: any): void {
    this.eventQueue.push({
      event,
      session,
      timestamp: Date.now()
    });

    // Process queue after backoff delay
    if (!this.processingTimeout) {
      const delay = this.getBackoffDelay();
      this.processingTimeout = setTimeout(() => {
        this.processQueuedEvents();
      }, delay);
    }
  }

  /**
   * Process queued events
   */
  private async processQueuedEvents(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.processingTimeout = null;

    try {
      // Get the most recent event (ignore older ones)
      const latestEvent = this.eventQueue[this.eventQueue.length - 1];
      this.eventQueue = []; // Clear the queue

      logger.info('Processing queued auth state change', {
        event: latestEvent.event,
        queueSize: this.eventQueue.length,
        delay: Date.now() - latestEvent.timestamp
      });

      // Process the latest event
      await this.processEvent(latestEvent.event, latestEvent.session, () => {});
      
    } catch (error) {
      logger.error('Error processing queued auth events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single auth state change event
   */
  private async processEvent(
    event: string,
    session: any,
    handler: (event: string, session: any) => Promise<void> | void
  ): Promise<void> {
    try {
      this.authStateChangeCount++;
      this.lastAuthStateChange = Date.now();

      logger.info('Processing auth state change', {
        event,
        changeCount: this.authStateChangeCount,
        hasSession: !!session,
        timestamp: new Date().toISOString()
      });

      // Call the handler
      await handler(event, session);

    } catch (error) {
      logger.error('Error processing auth state change:', error);
    }
  }

  /**
   * Reset the auth state manager (useful for testing or manual reset)
   */
  reset(): void {
    this.authStateChangeCount = 0;
    this.lastAuthStateChange = 0;
    this.eventQueue = [];
    this.isProcessing = false;
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    logger.info('Auth state manager reset');
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      changeCount: this.authStateChangeCount,
      lastChangeTime: this.lastAuthStateChange,
      queueSize: this.eventQueue.length,
      isProcessing: this.isProcessing,
      backoffConfig: this.backoffConfig
    };
  }
}

/**
 * Hook to use the auth state manager
 */
export function useAuthStateManager() {
  const manager = AuthStateManager.getInstance();

  const processAuthStateChange = React.useCallback(
    async (
      event: string,
      session: any,
      handler: (event: string, session: any) => Promise<void> | void
    ) => {
      await manager.processAuthStateChange(event, session, handler);
    },
    [manager]
  );

  const reset = React.useCallback(() => {
    manager.reset();
  }, [manager]);

  const getStats = React.useCallback(() => {
    return manager.getStats();
  }, [manager]);

  return {
    processAuthStateChange,
    reset,
    getStats,
  };
}

// Import React for the hook
import React from 'react';
