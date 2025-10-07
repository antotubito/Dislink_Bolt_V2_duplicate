// Prefetching utilities for better performance
import { logger } from '@dislink/shared/lib/logger';

interface PrefetchOptions {
  priority?: 'high' | 'low';
  timeout?: number;
}

class PrefetchManager {
  private prefetchedModules = new Set<string>();
  private prefetchQueue: Array<() => Promise<any>> = [];
  private isPrefetching = false;

  /**
   * Prefetch a module by its import path
   */
  async prefetchModule(modulePath: string, options: PrefetchOptions = {}): Promise<void> {
    if (this.prefetchedModules.has(modulePath)) {
      logger.info(`Module ${modulePath} already prefetched`);
      return;
    }

    const prefetchFn = async () => {
      try {
        logger.info(`Prefetching module: ${modulePath}`);
        await import(/* @vite-ignore */ modulePath);
        this.prefetchedModules.add(modulePath);
        logger.info(`Successfully prefetched: ${modulePath}`);
      } catch (error) {
        logger.warn(`Failed to prefetch ${modulePath}:`, error);
      }
    };

    if (options.priority === 'high') {
      // High priority prefetching - execute immediately
      await prefetchFn();
    } else {
      // Low priority prefetching - add to queue
      this.prefetchQueue.push(prefetchFn);
      this.processPrefetchQueue();
    }
  }

  /**
   * Process the prefetch queue with idle time
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching || this.prefetchQueue.length === 0) {
      return;
    }

    this.isPrefetching = true;

    // Use requestIdleCallback for non-blocking prefetching
    const processNext = () => {
      if (this.prefetchQueue.length === 0) {
        this.isPrefetching = false;
        return;
      }

      const prefetchFn = this.prefetchQueue.shift()!;
      prefetchFn().finally(() => {
        // Process next item after a small delay
        setTimeout(processNext, 100);
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(processNext, { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(processNext, 100);
    }
  }

  /**
   * Prefetch based on user navigation patterns
   */
  prefetchForRoute(currentRoute: string): void {
    // Disable prefetching for now to avoid module loading errors
    // TODO: Fix module path resolution for dynamic imports
    return;
    
    const prefetchMap: Record<string, string[]> = {
      '/app': [
        // Home page - prefetch likely next pages
        './pages/Contacts',
        './pages/Profile',
        './components/contacts/ContactCard',
        './components/contacts/ConnectionStats',
        './components/home/DailyNeedSection'
      ],
      '/app/contacts': [
        // Contacts page - prefetch contact details
        './pages/ContactProfile',
        './components/contacts/ContactCard',
        './components/contacts/LocationSelectionModal',
        './components/contacts/TagSelectionModal'
      ],
      '/app/profile': [
        // Profile page - prefetch settings
        './pages/Settings',
        './components/profile/ProfileImageUpload',
        './components/profile/JobTitleInput',
        './components/profile/IndustrySelect'
      ],
      '/app/login': [
        // Login page - prefetch register and onboarding
        './pages/Register',
        './pages/Onboarding',
        './components/onboarding/OnboardingStep',
        './components/onboarding/AnimatedInput'
      ],
      '/app/register': [
        // Register page - prefetch onboarding
        './pages/Onboarding',
        './components/onboarding/OnboardingStep',
        './components/onboarding/AnimatedInput',
        './components/onboarding/LocationStep'
      ]
    };

    const modulesToPrefetch = prefetchMap[currentRoute] || [];
    
    modulesToPrefetch.forEach(modulePath => {
      this.prefetchModule(modulePath, { priority: 'low' });
    });
  }

  /**
   * Prefetch critical user flows
   */
  prefetchCriticalFlows(): void {
    // Disable prefetching for now to avoid module loading errors
    // TODO: Fix module path resolution for dynamic imports
    return;
    
    const criticalModules = [
      // Authentication flow
      './pages/Login',
      './pages/Register',
      './pages/Onboarding',
      
      // Core app functionality
      './pages/Home',
      './pages/Contacts',
      './pages/Profile',
      
      // Heavy components
      './components/qr/QRModal',
      './components/qr/QRScanner',
      './components/contacts/ContactCard',
      './components/profile/ProfileImageUpload'
    ];

    criticalModules.forEach(modulePath => {
      this.prefetchModule(modulePath, { priority: 'low' });
    });
  }

  /**
   * Prefetch based on user interaction hints
   */
  prefetchOnHover(element: HTMLElement, modulePath: string): void {
    let prefetchTimeout: NodeJS.Timeout;

    const handleMouseEnter = () => {
      prefetchTimeout = setTimeout(() => {
        this.prefetchModule(modulePath, { priority: 'high' });
      }, 200); // 200ms delay to avoid prefetching on accidental hovers
    };

    const handleMouseLeave = () => {
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Return cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
      }
    };
  }

  /**
   * Prefetch on link focus (keyboard navigation)
   */
  prefetchOnFocus(element: HTMLElement, modulePath: string): void {
    const handleFocus = () => {
      this.prefetchModule(modulePath, { priority: 'high' });
    };

    element.addEventListener('focus', handleFocus);

    // Return cleanup function
    return () => {
      element.removeEventListener('focus', handleFocus);
    };
  }

  /**
   * Get prefetch statistics
   */
  getStats() {
    return {
      prefetchedCount: this.prefetchedModules.size,
      queueLength: this.prefetchQueue.length,
      isPrefetching: this.isPrefetching,
      prefetchedModules: Array.from(this.prefetchedModules)
    };
  }
}

// Export singleton instance
export const prefetchManager = new PrefetchManager();

// Export utility functions
export const prefetchModule = (modulePath: string, options?: PrefetchOptions) => 
  prefetchManager.prefetchModule(modulePath, options);

export const prefetchForRoute = (route: string) => 
  prefetchManager.prefetchForRoute(route);

export const prefetchCriticalFlows = () => 
  prefetchManager.prefetchCriticalFlows();

export const prefetchOnHover = (element: HTMLElement, modulePath: string) => 
  prefetchManager.prefetchOnHover(element, modulePath);

export const prefetchOnFocus = (element: HTMLElement, modulePath: string) => 
  prefetchManager.prefetchOnFocus(element, modulePath);

export const getPrefetchStats = () => 
  prefetchManager.getStats();
