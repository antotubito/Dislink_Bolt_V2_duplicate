/**
 * Performance Budgets and Monitoring System
 * Defines and enforces performance budgets for the application
 */

interface PerformanceBudget {
  name: string;
  metric: string;
  threshold: number;
  unit: 'ms' | 'bytes' | 'count' | 'score';
  severity: 'error' | 'warning' | 'info';
  description: string;
}

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Additional metrics
  fmp?: number; // First Meaningful Paint
  si?: number; // Speed Index
  tbt?: number; // Total Blocking Time
  tti?: number; // Time to Interactive
  
  // Resource metrics
  bundleSize?: number;
  imageSize?: number;
  totalRequests?: number;
  cacheHitRate?: number;
  
  // Custom metrics
  apiResponseTime?: number;
  componentRenderTime?: number;
  routeTransitionTime?: number;
}

class PerformanceBudgetManager {
  private budgets: PerformanceBudget[] = [];
  private metrics: PerformanceMetrics = {};
  private violations: Array<{ budget: PerformanceBudget; actual: number; timestamp: number }> = [];

  constructor() {
    this.initializeDefaultBudgets();
    this.startMonitoring();
  }

  private initializeDefaultBudgets(): void {
    this.budgets = [
      // Core Web Vitals
      {
        name: 'LCP',
        metric: 'lcp',
        threshold: 2500,
        unit: 'ms',
        severity: 'error',
        description: 'Largest Contentful Paint should be under 2.5s'
      },
      {
        name: 'FID',
        metric: 'fid',
        threshold: 100,
        unit: 'ms',
        severity: 'error',
        description: 'First Input Delay should be under 100ms'
      },
      {
        name: 'CLS',
        metric: 'cls',
        threshold: 0.1,
        unit: 'score',
        severity: 'error',
        description: 'Cumulative Layout Shift should be under 0.1'
      },
      {
        name: 'FCP',
        metric: 'fcp',
        threshold: 1800,
        unit: 'ms',
        severity: 'warning',
        description: 'First Contentful Paint should be under 1.8s'
      },
      {
        name: 'TTFB',
        metric: 'ttfb',
        threshold: 800,
        unit: 'ms',
        severity: 'warning',
        description: 'Time to First Byte should be under 800ms'
      },
      
      // Bundle size budgets
      {
        name: 'Main Bundle Size',
        metric: 'bundleSize',
        threshold: 500 * 1024, // 500KB
        unit: 'bytes',
        severity: 'warning',
        description: 'Main JavaScript bundle should be under 500KB'
      },
      {
        name: 'Total Image Size',
        metric: 'imageSize',
        threshold: 2 * 1024 * 1024, // 2MB
        unit: 'bytes',
        severity: 'warning',
        description: 'Total image size should be under 2MB'
      },
      
      // Request budgets
      {
        name: 'Total Requests',
        metric: 'totalRequests',
        threshold: 50,
        unit: 'count',
        severity: 'warning',
        description: 'Total number of requests should be under 50'
      },
      
      // Performance budgets
      {
        name: 'API Response Time',
        metric: 'apiResponseTime',
        threshold: 1000,
        unit: 'ms',
        severity: 'warning',
        description: 'API response time should be under 1s'
      },
      {
        name: 'Component Render Time',
        metric: 'componentRenderTime',
        threshold: 16, // 60fps
        unit: 'ms',
        severity: 'warning',
        description: 'Component render time should be under 16ms'
      },
      {
        name: 'Route Transition Time',
        metric: 'routeTransitionTime',
        threshold: 300,
        unit: 'ms',
        severity: 'warning',
        description: 'Route transition time should be under 300ms'
      }
    ];
  }

  private startMonitoring(): void {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor bundle size
    this.monitorBundleSize();
    
    // Monitor API performance
    this.monitorApiPerformance();
    
    // Monitor component performance
    this.monitorComponentPerformance();
    
    // Monitor route transitions
    this.monitorRouteTransitions();
  }

  private observeWebVitals(): void {
    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.updateMetric('lcp', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.updateMetric('fid', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.updateMetric('cls', clsValue);
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });

    // FCP - First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.updateMetric('fcp', entry.startTime);
        }
      });
    }).observe({ entryTypes: ['paint'] });

    // TTFB - Time to First Byte
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.responseStart > 0) {
          this.updateMetric('ttfb', entry.responseStart - entry.requestStart);
        }
      });
    }).observe({ entryTypes: ['navigation'] });
  }

  private monitorBundleSize(): void {
    // Monitor script tags
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    scripts.forEach((script) => {
      const src = script.getAttribute('src');
      if (src) {
        // Estimate bundle size (this would need actual size measurement in production)
        fetch(src, { method: 'HEAD' })
          .then(response => {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              totalSize += parseInt(contentLength);
              this.updateMetric('bundleSize', totalSize);
            }
          })
          .catch(() => {
            // Fallback estimation
            totalSize += 100000; // 100KB estimate
            this.updateMetric('bundleSize', totalSize);
          });
      }
    });
  }

  private monitorApiPerformance(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.updateMetric('apiResponseTime', duration);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.updateMetric('apiResponseTime', duration);
        throw error;
      }
    };
  }

  private monitorComponentPerformance(): void {
    // This would be integrated with React DevTools or custom profiling
    // For now, we'll monitor render times through performance marks
    const originalConsoleLog = console.log;
    
    console.log = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('render-time')) {
        const renderTime = parseFloat(args[1]);
        if (!isNaN(renderTime)) {
          this.updateMetric('componentRenderTime', renderTime);
        }
      }
      originalConsoleLog.apply(console, args);
    };
  }

  private monitorRouteTransitions(): void {
    let routeStartTime = 0;
    
    // Monitor route changes (this would be integrated with React Router)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      routeStartTime = performance.now();
      return originalPushState.apply(this, args);
    };
    
    history.replaceState = function(...args) {
      routeStartTime = performance.now();
      return originalReplaceState.apply(this, args);
    };
    
    window.addEventListener('popstate', () => {
      routeStartTime = performance.now();
    });
    
    // Monitor when route transition completes
    const observer = new MutationObserver(() => {
      if (routeStartTime > 0) {
        const transitionTime = performance.now() - routeStartTime;
        this.updateMetric('routeTransitionTime', transitionTime);
        routeStartTime = 0;
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  updateMetric(metric: string, value: number): void {
    this.metrics[metric] = value;
    this.checkBudgets(metric, value);
  }

  private checkBudgets(metric: string, value: number): void {
    const relevantBudgets = this.budgets.filter(budget => budget.metric === metric);
    
    relevantBudgets.forEach(budget => {
      if (this.isViolation(budget, value)) {
        this.recordViolation(budget, value);
        this.handleViolation(budget, value);
      }
    });
  }

  private isViolation(budget: PerformanceBudget, value: number): boolean {
    return value > budget.threshold;
  }

  private recordViolation(budget: PerformanceBudget, actual: number): void {
    this.violations.push({
      budget,
      actual,
      timestamp: Date.now()
    });
  }

  private handleViolation(budget: PerformanceBudget, actual: number): void {
    const message = `Performance Budget Violation: ${budget.name} - ${actual}${budget.unit} exceeds threshold of ${budget.threshold}${budget.unit}`;
    
    switch (budget.severity) {
      case 'error':
        console.error(`🚨 ${message}`);
        // Could send to error tracking service
        break;
      case 'warning':
        console.warn(`⚠️ ${message}`);
        break;
      case 'info':
        console.info(`ℹ️ ${message}`);
        break;
    }
  }

  // Public API
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getViolations(): Array<{ budget: PerformanceBudget; actual: number; timestamp: number }> {
    return [...this.violations];
  }

  getBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget);
  }

  removeBudget(name: string): void {
    this.budgets = this.budgets.filter(budget => budget.name !== name);
  }

  getBudgetStatus(): {
    passed: number;
    failed: number;
    total: number;
    violations: Array<{ budget: PerformanceBudget; actual: number; timestamp: number }>;
  } {
    const violations = this.getViolations();
    const total = this.budgets.length;
    const failed = violations.length;
    const passed = total - failed;

    return {
      passed,
      failed,
      total,
      violations
    };
  }

  // Generate performance report
  generateReport(): {
    timestamp: number;
    metrics: PerformanceMetrics;
    budgetStatus: ReturnType<typeof this.getBudgetStatus>;
    recommendations: string[];
  } {
    const budgetStatus = this.getBudgetStatus();
    const recommendations = this.generateRecommendations();

    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      budgetStatus,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const violations = this.getViolations();

    violations.forEach(({ budget, actual }) => {
      switch (budget.metric) {
        case 'lcp':
          recommendations.push('Optimize images, use lazy loading, and improve server response times');
          break;
        case 'fid':
          recommendations.push('Reduce JavaScript execution time and optimize third-party scripts');
          break;
        case 'cls':
          recommendations.push('Add size attributes to images and avoid inserting content above existing content');
          break;
        case 'bundleSize':
          recommendations.push('Implement code splitting, remove unused dependencies, and optimize imports');
          break;
        case 'apiResponseTime':
          recommendations.push('Optimize API endpoints, implement caching, and consider database query optimization');
          break;
        case 'componentRenderTime':
          recommendations.push('Optimize React components, use React.memo, and reduce unnecessary re-renders');
          break;
        case 'routeTransitionTime':
          recommendations.push('Implement route preloading and optimize component loading');
          break;
      }
    });

    return recommendations;
  }
}

// Create global instance
export const performanceBudgetManager = new PerformanceBudgetManager();

// Export types and utilities
export { PerformanceBudgetManager };
export type { PerformanceBudget, PerformanceMetrics };
