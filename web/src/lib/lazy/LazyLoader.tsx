/**
 * Advanced Lazy Loading System
 * Implements intelligent component and resource lazy loading with preloading strategies
 */

import { ComponentType, lazy, Suspense } from 'react';
import { componentCache } from '../cache/AdvancedCache';

interface LazyLoadOptions {
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  fallback?: ComponentType;
  retryCount?: number;
  retryDelay?: number;
}

interface PreloadStrategy {
  onHover?: boolean;
  onIntersection?: boolean;
  onRouteChange?: boolean;
  onIdle?: boolean;
}

class LazyLoader {
  private preloadQueue: Set<string> = new Set();
  private loadingComponents: Map<string, Promise<any>> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Create a lazy component with advanced options
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    componentName: string,
    options: LazyLoadOptions = {}
  ): T {
    const {
      preload = false,
      priority = 'medium',
      timeout = 10000,
      fallback,
      retryCount = 3,
      retryDelay = 1000
    } = options;

    // Check cache first
    const cached = componentCache.get(componentName);
    if (cached) {
      return cached;
    }

    const lazyComponent = lazy(async () => {
      try {
        // Check if already loading
        if (this.loadingComponents.has(componentName)) {
          return this.loadingComponents.get(componentName)!;
        }

        // Create loading promise with timeout
        const loadingPromise = Promise.race([
          importFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Component ${componentName} load timeout`)), timeout)
          )
        ]);

        this.loadingComponents.set(componentName, loadingPromise);

        const module = await loadingPromise;
        
        // Cache the component
        componentCache.set(componentName, module.default);
        
        // Remove from loading map
        this.loadingComponents.delete(componentName);
        
        return module;
      } catch (error) {
        // Handle retry logic
        const attempts = this.retryAttempts.get(componentName) || 0;
        
        if (attempts < retryCount) {
          this.retryAttempts.set(componentName, attempts + 1);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
          
          // Retry
          return this.createLazyComponent(importFn, componentName, options);
        }
        
        // Max retries reached, throw error
        this.retryAttempts.delete(componentName);
        this.loadingComponents.delete(componentName);
        throw error;
      }
    });

    // Preload if requested
    if (preload) {
      this.preloadComponent(componentName, importFn, priority);
    }

    return lazyComponent as T;
  }

  /**
   * Preload a component
   */
  async preloadComponent(
    componentName: string,
    importFn: () => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    if (this.preloadQueue.has(componentName) || componentCache.has(componentName)) {
      return;
    }

    this.preloadQueue.add(componentName);

    try {
      const module = await importFn();
      componentCache.set(componentName, module.default);
    } catch (error) {
      console.warn(`Failed to preload component ${componentName}:`, error);
    } finally {
      this.preloadQueue.delete(componentName);
    }
  }

  /**
   * Preload components based on strategy
   */
  setupPreloadStrategy(
    components: Record<string, () => Promise<any>>,
    strategy: PreloadStrategy
  ): void {
    const { onHover, onIntersection, onRouteChange, onIdle } = strategy;

    // Preload on hover
    if (onHover) {
      this.setupHoverPreloading(components);
    }

    // Preload on intersection
    if (onIntersection) {
      this.setupIntersectionPreloading(components);
    }

    // Preload on route change
    if (onRouteChange) {
      this.setupRoutePreloading(components);
    }

    // Preload on idle
    if (onIdle) {
      this.setupIdlePreloading(components);
    }
  }

  private setupHoverPreloading(components: Record<string, () => Promise<any>>): void {
    const hoverElements = document.querySelectorAll('[data-preload-hover]');
    
    hoverElements.forEach(element => {
      const componentName = element.getAttribute('data-preload-hover');
      if (componentName && components[componentName]) {
        element.addEventListener('mouseenter', () => {
          this.preloadComponent(componentName, components[componentName], 'high');
        });
      }
    });
  }

  private setupIntersectionPreloading(components: Record<string, () => Promise<any>>): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const componentName = entry.target.getAttribute('data-preload-intersection');
            if (componentName && components[componentName]) {
              this.preloadComponent(componentName, components[componentName], 'medium');
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    const intersectionElements = document.querySelectorAll('[data-preload-intersection]');
    intersectionElements.forEach(element => observer.observe(element));
  }

  private setupRoutePreloading(components: Record<string, () => Promise<any>>): void {
    // Listen for route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const handleRouteChange = (pathname: string) => {
      // Preload components based on route
      const routeComponents = this.getRouteComponents(pathname);
      routeComponents.forEach(componentName => {
        if (components[componentName]) {
          this.preloadComponent(componentName, components[componentName], 'high');
        }
      });
    };

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleRouteChange(location.pathname);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleRouteChange(location.pathname);
    };

    window.addEventListener('popstate', () => {
      handleRouteChange(location.pathname);
    });
  }

  private setupIdlePreloading(components: Record<string, () => Promise<any>>): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload low priority components during idle time
        Object.entries(components).forEach(([componentName, importFn]) => {
          this.preloadComponent(componentName, importFn, 'low');
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        Object.entries(components).forEach(([componentName, importFn]) => {
          this.preloadComponent(componentName, importFn, 'low');
        });
      }, 2000);
    }
  }

  private getRouteComponents(pathname: string): string[] {
    // Map routes to components that should be preloaded
    const routeMap: Record<string, string[]> = {
      '/': ['LandingPage'],
      '/app': ['Home', 'Dashboard'],
      '/app/profile': ['Profile', 'ProfileEdit'],
      '/app/contacts': ['Contacts', 'ContactList'],
      '/app/settings': ['Settings', 'SettingsForm'],
      '/app/analytics': ['AnalyticsDashboard'],
    };

    return routeMap[pathname] || [];
  }

  /**
   * Create a Suspense wrapper with fallback
   */
  createSuspenseWrapper(
    children: React.ReactNode,
    fallback?: React.ReactNode
  ): React.ReactElement {
    const defaultFallback = (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );

    return (
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    );
  }

  /**
   * Get loading statistics
   */
  getStats(): {
    cachedComponents: number;
    loadingComponents: number;
    preloadQueue: number;
    retryAttempts: Record<string, number>;
  } {
    return {
      cachedComponents: componentCache.size(),
      loadingComponents: this.loadingComponents.size,
      preloadQueue: this.preloadQueue.size,
      retryAttempts: Object.fromEntries(this.retryAttempts)
    };
  }

  /**
   * Clear cache and reset state
   */
  clear(): void {
    componentCache.clear();
    this.preloadQueue.clear();
    this.loadingComponents.clear();
    this.retryAttempts.clear();
  }
}

// Create global instance
export const lazyLoader = new LazyLoader();

// Utility functions
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string,
  options?: LazyLoadOptions
): T => {
  return lazyLoader.createLazyComponent(importFn, componentName, options);
};

export const preloadComponent = (
  componentName: string,
  importFn: () => Promise<any>,
  priority?: 'high' | 'medium' | 'low'
): Promise<void> => {
  return lazyLoader.preloadComponent(componentName, importFn, priority);
};

export const setupPreloadStrategy = (
  components: Record<string, () => Promise<any>>,
  strategy: PreloadStrategy
): void => {
  lazyLoader.setupPreloadStrategy(components, strategy);
};

export const createSuspenseWrapper = (
  children: React.ReactNode,
  fallback?: React.ReactNode
): React.ReactElement => {
  return lazyLoader.createSuspenseWrapper(children, fallback);
};

export { LazyLoader };
export type { LazyLoadOptions, PreloadStrategy };
