import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@dislink/shared/lib/logger';

interface NavigationThrottleOptions {
  throttleMs?: number;
  maxCallsPerWindow?: number;
  windowMs?: number;
}

export function useNavigationThrottle(options: NavigationThrottleOptions = {}) {
  const navigate = useNavigate();
  const {
    throttleMs = 1000, // Minimum 1 second between navigations
    maxCallsPerWindow = 5, // Max 5 navigations per window
    windowMs = 10000 // 10 second window
  } = options;

  const lastNavigationRef = useRef<number>(0);
  const navigationHistoryRef = useRef<number[]>([]);
  const isNavigatingRef = useRef<boolean>(false);

  const throttledNavigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const now = Date.now();
    
    // Clear old navigation history
    navigationHistoryRef.current = navigationHistoryRef.current.filter(
      timestamp => now - timestamp < windowMs
    );

    // Check if we're already navigating
    if (isNavigatingRef.current) {
      logger.warn('🚫 Navigation blocked: Already navigating');
      return;
    }

    // Check throttle limit
    if (now - lastNavigationRef.current < throttleMs) {
      logger.warn('🚫 Navigation blocked: Throttle limit exceeded', {
        timeSinceLastNavigation: now - lastNavigationRef.current,
        throttleMs
      });
      return;
    }

    // Check max calls per window
    if (navigationHistoryRef.current.length >= maxCallsPerWindow) {
      logger.warn('🚫 Navigation blocked: Max calls per window exceeded', {
        callsInWindow: navigationHistoryRef.current.length,
        maxCallsPerWindow,
        windowMs
      });
      return;
    }

    // Record this navigation
    lastNavigationRef.current = now;
    navigationHistoryRef.current.push(now);
    isNavigatingRef.current = true;

    logger.info('🔄 Navigation allowed:', {
      to,
      options,
      timeSinceLastNavigation: now - lastNavigationRef.current,
      callsInWindow: navigationHistoryRef.current.length
    });

    // Perform navigation
    navigate(to, options);

    // Reset navigation flag after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [navigate, throttleMs, maxCallsPerWindow, windowMs]);

  return throttledNavigate;
}
