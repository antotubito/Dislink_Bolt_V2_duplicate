/**
 * Analytics Provider Component
 * Provides analytics context and automatic tracking for the entire application
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@dislink/shared/lib/analytics';
import { usePageTracking } from '../../hooks/useAnalytics';

interface AnalyticsContextType {
  analytics: typeof analytics;
  trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>;
  trackPageView: (pageName: string, properties?: Record<string, any>) => Promise<void>;
  trackBusinessEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>;
  trackConversion: (conversionName: string, value?: number, properties?: Record<string, any>) => Promise<void>;
  trackError: (errorName: string, errorMessage: string, properties?: Record<string, any>) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  enableAutoTracking?: boolean;
  enablePerformanceTracking?: boolean;
  enableErrorTracking?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  enableAutoTracking = true,
  enablePerformanceTracking = true,
  enableErrorTracking = true
}) => {
  const location = useLocation();

  // Enable automatic page tracking
  usePageTracking();

  useEffect(() => {
    if (!enableAutoTracking) return;

    // Track initial page load
    const startTime = performance.now();
    
    const handlePageLoad = () => {
      const loadTime = performance.now() - startTime;
      analytics.trackEvent('page_load', {
        page_name: getPageNameFromPath(location.pathname),
        load_time: loadTime,
        path: location.pathname,
        search: location.search,
        hash: location.hash
      }, 'performance');
    };

    // Track page load after a short delay to ensure all resources are loaded
    const timer = setTimeout(handlePageLoad, 100);

    return () => clearTimeout(timer);
  }, [location, enableAutoTracking]);

  useEffect(() => {
    if (!enablePerformanceTracking) return;

    // Track performance metrics
    const trackPerformance = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          analytics.trackEvent('performance_metrics', {
            page_name: getPageNameFromPath(location.pathname),
            dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            load_complete: navigation.loadEventEnd - navigation.loadEventStart,
            first_paint: getFirstPaint(),
            first_contentful_paint: getFirstContentfulPaint(),
            largest_contentful_paint: getLargestContentfulPaint(),
            cumulative_layout_shift: getCumulativeLayoutShift()
          }, 'performance');
        }
      }
    };

    // Track performance after page load
    if (document.readyState === 'complete') {
      trackPerformance();
    } else {
      window.addEventListener('load', trackPerformance);
      return () => window.removeEventListener('load', trackPerformance);
    }
  }, [location, enablePerformanceTracking]);

  useEffect(() => {
    if (!enableErrorTracking) return;

    // Track JavaScript errors
    const handleError = (event: ErrorEvent) => {
      analytics.trackError('javascript_error', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        page_name: getPageNameFromPath(location.pathname)
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError('unhandled_promise_rejection', event.reason?.toString() || 'Unknown error', {
        page_name: getPageNameFromPath(location.pathname),
        stack: event.reason?.stack
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [location, enableErrorTracking]);

  // Track user engagement
  useEffect(() => {
    if (!enableAutoTracking) return;

    let startTime = Date.now();
    let isVisible = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the page
        const timeSpent = Date.now() - startTime;
        analytics.trackEvent('time_on_page', {
          page_name: getPageNameFromPath(location.pathname),
          time_spent: timeSpent,
          path: location.pathname
        });
        isVisible = false;
      } else {
        // User returned to the page
        startTime = Date.now();
        isVisible = true;
      }
    };

    const handleBeforeUnload = () => {
      if (isVisible) {
        const timeSpent = Date.now() - startTime;
        analytics.trackEvent('time_on_page', {
          page_name: getPageNameFromPath(location.pathname),
          time_spent: timeSpent,
          path: location.pathname
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location, enableAutoTracking]);

  // Track scroll depth
  useEffect(() => {
    if (!enableAutoTracking) return;

    let maxScrollDepth = 0;
    const scrollThresholds = [25, 50, 75, 90, 100];
    const trackedThresholds = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;

        // Track scroll depth milestones
        scrollThresholds.forEach(threshold => {
          if (scrollDepth >= threshold && !trackedThresholds.has(threshold)) {
            trackedThresholds.add(threshold);
            analytics.trackEvent('scroll_depth', {
              page_name: getPageNameFromPath(location.pathname),
              scroll_depth: threshold,
              path: location.pathname
            });
          }
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location, enableAutoTracking]);

  const contextValue: AnalyticsContextType = {
    analytics,
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackBusinessEvent: analytics.trackBusinessEvent.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackError: analytics.trackError.bind(analytics)
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook to use analytics context
export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

// Utility functions for performance metrics
function getFirstPaint(): number | null {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }
  return null;
}

function getFirstContentfulPaint(): number | null {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }
  return null;
}

function getLargestContentfulPaint(): number | null {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lastLcpEntry = lcpEntries[lcpEntries.length - 1];
    return lastLcpEntry ? lastLcpEntry.startTime : null;
  }
  return null;
}

function getCumulativeLayoutShift(): number | null {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const clsEntries = performance.getEntriesByType('layout-shift');
    let clsValue = 0;
    clsEntries.forEach(entry => {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    });
    return clsValue;
  }
  return null;
}

function getPageNameFromPath(path: string): string {
  const pathMap: Record<string, string> = {
    '/': 'landing_page',
    '/register': 'registration_page',
    '/login': 'login_page',
    '/confirmed': 'email_confirmed_page',
    '/onboarding': 'onboarding_page',
    '/dashboard': 'dashboard_page',
    '/profile': 'profile_page',
    '/settings': 'settings_page',
    '/connections': 'connections_page',
    '/qr': 'qr_code_page',
    '/analytics': 'analytics_dashboard'
  };

  return pathMap[path] || `page_${path.replace(/\//g, '_').replace(/^_/, '')}`;
}
