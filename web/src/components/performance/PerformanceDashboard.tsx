/**
 * Performance Monitoring Dashboard
 * Real-time performance metrics and optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { performanceBudgetManager } from '../../lib/performance/PerformanceBudgets';
import { lazyLoader } from '../../lib/lazy/LazyLoader';
import { cacheUtils } from '../../lib/cache/AdvancedCache';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  
  // Additional metrics
  bundleSize?: number;
  totalRequests?: number;
  cacheHitRate?: number;
  apiResponseTime?: number;
  componentRenderTime?: number;
  routeTransitionTime?: number;
}

interface BudgetViolation {
  budget: {
    name: string;
    metric: string;
    threshold: number;
    unit: string;
    severity: 'error' | 'warning' | 'info';
    description: string;
  };
  actual: number;
  timestamp: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [violations, setViolations] = useState<BudgetViolation[]>([]);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [lazyStats, setLazyStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
    
    // Update metrics every 5 seconds
    const interval = setInterval(loadPerformanceData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = () => {
    try {
      // Get performance metrics
      const currentMetrics = performanceBudgetManager.getMetrics();
      setMetrics(currentMetrics);

      // Get budget violations
      const currentViolations = performanceBudgetManager.getViolations();
      setViolations(currentViolations);

      // Get cache statistics
      const currentCacheStats = cacheUtils.getCacheStats();
      setCacheStats(currentCacheStats);

      // Get lazy loading statistics
      const currentLazyStats = lazyLoader.getStats();
      setLazyStats(currentLazyStats);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      setLoading(false);
    }
  };

  const formatMetric = (value: number | undefined, unit: string): string => {
    if (value === undefined) return 'N/A';
    
    switch (unit) {
      case 'ms':
        return `${value.toFixed(0)}ms`;
      case 'bytes':
        return formatBytes(value);
      case 'count':
        return value.toString();
      case 'score':
        return value.toFixed(3);
      default:
        return value.toString();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceScore = (): number => {
    const scores = [];
    
    // LCP score (0-100)
    if (metrics.lcp !== undefined) {
      scores.push(Math.max(0, 100 - (metrics.lcp / 25))); // 2.5s = 0, 0s = 100
    }
    
    // FID score (0-100)
    if (metrics.fid !== undefined) {
      scores.push(Math.max(0, 100 - (metrics.fid * 10))); // 100ms = 0, 0ms = 100
    }
    
    // CLS score (0-100)
    if (metrics.cls !== undefined) {
      scores.push(Math.max(0, 100 - (metrics.cls * 1000))); // 0.1 = 0, 0 = 100
    }
    
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const performanceScore = getPerformanceScore();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="mt-2 text-gray-600">Real-time performance monitoring and optimization insights</p>
        </div>

        {/* Performance Score */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Performance Score</h2>
                <p className="text-gray-600">Overall application performance rating</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${
                  performanceScore >= 90 ? 'text-green-600' :
                  performanceScore >= 70 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {performanceScore}
                </div>
                <div className="text-sm text-gray-500">out of 100</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    performanceScore >= 90 ? 'bg-green-600' :
                    performanceScore >= 70 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${performanceScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Largest Contentful Paint"
            value={formatMetric(metrics.lcp, 'ms')}
            threshold={2500}
            actual={metrics.lcp}
            unit="ms"
            description="Time to render the largest content element"
            status={metrics.lcp && metrics.lcp <= 2500 ? 'good' : 'poor'}
          />
          <MetricCard
            title="First Input Delay"
            value={formatMetric(metrics.fid, 'ms')}
            threshold={100}
            actual={metrics.fid}
            unit="ms"
            description="Time from first user interaction to browser response"
            status={metrics.fid && metrics.fid <= 100 ? 'good' : 'poor'}
          />
          <MetricCard
            title="Cumulative Layout Shift"
            value={formatMetric(metrics.cls, 'score')}
            threshold={0.1}
            actual={metrics.cls}
            unit="score"
            description="Visual stability of the page"
            status={metrics.cls && metrics.cls <= 0.1 ? 'good' : 'poor'}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="First Contentful Paint"
            value={formatMetric(metrics.fcp, 'ms')}
            threshold={1800}
            actual={metrics.fcp}
            unit="ms"
            description="Time to first content render"
            status={metrics.fcp && metrics.fcp <= 1800 ? 'good' : 'poor'}
          />
          <MetricCard
            title="Time to First Byte"
            value={formatMetric(metrics.ttfb, 'ms')}
            threshold={800}
            actual={metrics.ttfb}
            unit="ms"
            description="Server response time"
            status={metrics.ttfb && metrics.ttfb <= 800 ? 'good' : 'poor'}
          />
          <MetricCard
            title="Bundle Size"
            value={formatMetric(metrics.bundleSize, 'bytes')}
            threshold={500 * 1024}
            actual={metrics.bundleSize}
            unit="bytes"
            description="JavaScript bundle size"
            status={metrics.bundleSize && metrics.bundleSize <= 500 * 1024 ? 'good' : 'poor'}
          />
          <MetricCard
            title="API Response Time"
            value={formatMetric(metrics.apiResponseTime, 'ms')}
            threshold={1000}
            actual={metrics.apiResponseTime}
            unit="ms"
            description="Average API response time"
            status={metrics.apiResponseTime && metrics.apiResponseTime <= 1000 ? 'good' : 'poor'}
          />
        </div>

        {/* Budget Violations */}
        {violations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Budget Violations</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="space-y-4">
                  {violations.slice(0, 10).map((violation, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getSeverityColor(violation.budget.severity)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{violation.budget.name}</h3>
                          <p className="text-sm opacity-75">{violation.budget.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg">
                            {formatMetric(violation.actual, violation.budget.unit)}
                          </div>
                          <div className="text-sm opacity-75">
                            Threshold: {formatMetric(violation.budget.threshold, violation.budget.unit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cache Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Statistics</h2>
            <div className="space-y-3">
              {Object.entries(cacheStats).map(([cacheName, stats]: [string, any]) => (
                <div key={cacheName} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{cacheName.replace('Cache', '')}</span>
                  <div className="text-right">
                    <div className="font-semibold">{stats.size} items</div>
                    <div className="text-sm text-gray-500">{formatBytes(stats.totalSize)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lazy Loading Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cached Components</span>
                <span className="font-semibold">{lazyStats.cachedComponents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Loading Components</span>
                <span className="font-semibold">{lazyStats.loadingComponents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Preload Queue</span>
                <span className="font-semibold">{lazyStats.preloadQueue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={loadPerformanceData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={() => {
              performanceBudgetManager.clear();
              lazyLoader.clear();
              loadPerformanceData();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  threshold: number;
  actual?: number;
  unit: string;
  description: string;
  status: 'good' | 'poor';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  threshold,
  actual,
  unit,
  description,
  status
}) => {
  const getStatusColor = (status: string): string => {
    return status === 'good' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: string): string => {
    return status === 'good' ? '✅' : '❌';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className={`text-2xl ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      {actual !== undefined && (
        <div className="text-xs text-gray-500">
          Threshold: {formatMetric(threshold, unit)}
        </div>
      )}
    </div>
  );
};

const formatMetric = (value: number, unit: string): string => {
  switch (unit) {
    case 'ms':
      return `${value.toFixed(0)}ms`;
    case 'bytes':
      return formatBytes(value);
    case 'count':
      return value.toString();
    case 'score':
      return value.toFixed(3);
    default:
      return value.toString();
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
