/**
 * Analytics Dashboard Component
 * Displays business metrics and conversion funnels
 */

import React, { useState, useEffect } from 'react';
import { getBusinessMetrics, getConversionRate, ANALYTICS_CONFIG } from '@dislink/shared/lib/analytics';
import { supabase } from '@dislink/shared/lib/supabase';

interface BusinessMetrics {
  total_events: number;
  unique_sessions: number;
  page_views: number;
  registrations: number;
  email_confirmations: number;
  onboarding_completions: number;
  profile_creations: number;
  connections_made: number;
  qr_codes_generated: number;
  qr_codes_scanned: number;
  invitations_sent: number;
  invitations_accepted: number;
  registration_to_email_confirmation: number;
  email_confirmation_to_onboarding: number;
  onboarding_to_profile_creation: number;
  qr_scan_to_connection: number;
  invitation_acceptance_rate: number;
}

interface ConversionFunnel {
  name: string;
  rate: number;
  steps: string[];
}

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeEvents, setRealTimeEvents] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // Today
  });

  useEffect(() => {
    loadAnalyticsData();
    setupRealTimeAnalytics();
  }, [dateRange]);

  const setupRealTimeAnalytics = () => {
    // Set up real-time subscription for analytics events
    const analyticsSubscription = supabase
      .channel('analytics-events')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'analytics_events' 
        }, 
        (payload) => {
          setRealTimeEvents(prev => [payload.new, ...prev.slice(0, 9)]); // Keep last 10 events
        }
      )
      .subscribe();

    // Set up real-time subscription for user journeys
    const journeySubscription = supabase
      .channel('user-journeys')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_journeys' 
        }, 
        (payload) => {
          // Update active users count
          updateActiveUsersCount();
        }
      )
      .subscribe();

    return () => {
      analyticsSubscription.unsubscribe();
      journeySubscription.unsubscribe();
    };
  };

  const updateActiveUsersCount = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('session_id')
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .neq('session_id', null);

      if (!error && data) {
        const uniqueSessions = new Set(data.map(event => event.session_id));
        setActiveUsers(uniqueSessions.size);
      }
    } catch (err) {
      console.error('Failed to update active users count:', err);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load business metrics
      const businessMetrics = await getBusinessMetrics(dateRange);
      setMetrics(businessMetrics as BusinessMetrics);

      // Load conversion funnels
      const funnelData = await Promise.all([
        getConversionRate(ANALYTICS_CONFIG.FUNNELS.REGISTRATION, dateRange),
        getConversionRate(ANALYTICS_CONFIG.FUNNELS.ONBOARDING, dateRange),
        getConversionRate(ANALYTICS_CONFIG.FUNNELS.PROFILE_CREATION, dateRange),
        getConversionRate(ANALYTICS_CONFIG.FUNNELS.CONNECTION, dateRange),
        getConversionRate(ANALYTICS_CONFIG.FUNNELS.ENGAGEMENT, dateRange)
      ]);

      setFunnels([
        {
          name: 'Registration Funnel',
          rate: funnelData[0],
          steps: ['Landing Page', 'Registration Form', 'Email Confirmation', 'Account Created']
        },
        {
          name: 'Onboarding Funnel',
          rate: funnelData[1],
          steps: ['Email Confirmed', 'Onboarding Started', 'Profile Setup', 'Onboarding Completed']
        },
        {
          name: 'Profile Creation Funnel',
          rate: funnelData[2],
          steps: ['Onboarding Completed', 'Profile Form', 'Profile Created']
        },
        {
          name: 'Connection Funnel',
          rate: funnelData[3],
          steps: ['QR Code Generated', 'QR Code Scanned', 'Connection Made']
        },
        {
          name: 'Engagement Funnel',
          rate: funnelData[4],
          steps: ['Profile Created', 'First Connection', 'Multiple Connections', 'Active User']
        }
      ]);

    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button
                  onClick={loadAnalyticsData}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Analytics</h1>
          <p className="text-gray-600">Track user behavior, conversion funnels, and business metrics</p>
          
          {/* Date Range Selector */}
          <div className="mt-4 flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={loadAnalyticsData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Users (5min)"
            value={activeUsers.toString()}
            icon="🟢"
            color="green"
            subtitle="Currently online"
          />
          <MetricCard
            title="Total Events"
            value={formatNumber(metrics?.total_events || 0)}
            icon="📊"
            color="blue"
          />
          <MetricCard
            title="Unique Sessions"
            value={formatNumber(metrics?.unique_sessions || 0)}
            icon="👥"
            color="purple"
          />
          <MetricCard
            title="Page Views"
            value={formatNumber(metrics?.page_views || 0)}
            icon="👁️"
            color="orange"
          />
        </div>

        {/* Real-time Events Feed */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Real-time Events</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {realTimeEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent events</p>
              ) : (
                realTimeEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-medium text-gray-900">{event.event_name}</p>
                        <p className="text-sm text-gray-500">{event.event_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                      {event.properties?.page_name && (
                        <p className="text-xs text-gray-400">{event.properties.page_name}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Email Confirmations"
            value={formatNumber(metrics?.email_confirmations || 0)}
            subtitle={`${formatPercentage(metrics?.registration_to_email_confirmation || 0)} of registrations`}
            icon="✉️"
            color="blue"
          />
          <MetricCard
            title="Onboarding Completed"
            value={formatNumber(metrics?.onboarding_completions || 0)}
            subtitle={`${formatPercentage(metrics?.email_confirmation_to_onboarding || 0)} of email confirmations`}
            icon="🎯"
            color="green"
          />
          <MetricCard
            title="Profiles Created"
            value={formatNumber(metrics?.profile_creations || 0)}
            subtitle={`${formatPercentage(metrics?.onboarding_to_profile_creation || 0)} of onboarding`}
            icon="👤"
            color="purple"
          />
          <MetricCard
            title="Connections Made"
            value={formatNumber(metrics?.connections_made || 0)}
            subtitle={`${formatPercentage(metrics?.qr_scan_to_connection || 0)} of QR scans`}
            icon="🔗"
            color="orange"
          />
        </div>

        {/* QR Code & Invitation Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="QR Codes Generated"
            value={formatNumber(metrics?.qr_codes_generated || 0)}
            icon="📱"
            color="blue"
          />
          <MetricCard
            title="QR Codes Scanned"
            value={formatNumber(metrics?.qr_codes_scanned || 0)}
            icon="📷"
            color="green"
          />
          <MetricCard
            title="Invitations Sent"
            value={formatNumber(metrics?.invitations_sent || 0)}
            icon="📤"
            color="purple"
          />
          <MetricCard
            title="Invitations Accepted"
            value={formatNumber(metrics?.invitations_accepted || 0)}
            subtitle={`${formatPercentage(metrics?.invitation_acceptance_rate || 0)} acceptance rate`}
            icon="✅"
            color="orange"
          />
        </div>

        {/* Conversion Funnels */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Conversion Funnels</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {funnels.map((funnel, index) => (
              <FunnelCard key={index} funnel={funnel} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

interface FunnelCardProps {
  funnel: ConversionFunnel;
}

const FunnelCard: React.FC<FunnelCardProps> = ({ funnel }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{funnel.name}</h3>
        <div className="text-2xl font-bold text-blue-600">{funnel.rate.toFixed(1)}%</div>
      </div>
      
      <div className="space-y-3">
        {funnel.steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
              {index + 1}
            </div>
            <span className="text-gray-700">{step}</span>
            {index < funnel.steps.length - 1 && (
              <div className="ml-auto text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
