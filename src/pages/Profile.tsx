import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ProfileView } from '../components/profile/ProfileView';
import { ProfileEdit } from '../components/profile/ProfileEdit';
import { ProfileActions } from '../components/profile/ProfileActions';
import { updateProfile, getCurrentProfile } from '../lib/profile';
import { sendTierNotifications } from '../lib/notifications';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

export function Profile() {
  const { user, refreshUser, connectionStatus, reconnectSupabase } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUser, setLocalUser] = useState(user);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [notificationSent, setNotificationSent] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Profile Page Debug:', {
      user: user ? { id: user.id, email: user.email, onboardingComplete: user.onboardingComplete } : null,
      loading,
      error,
      connectionStatus,
      retryCount
    });
  }, [user, loading, error, connectionStatus, retryCount]);

  // Simplified loading logic
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('📋 Loading profile data...');
        
        // If we have a user, use it directly
        if (user) {
          console.log('✅ Using authenticated user data');
          setLocalUser(user);
          setLoading(false);
          return;
        }

        // Try to get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw new Error('Failed to get session');
        }

        if (!session) {
          console.log('🚪 No session found, user needs to login');
          setError('Please sign in to view your profile');
          setLoading(false);
          return;
        }

        console.log('🔄 Refreshing user data...');
        await refreshUser();
        
      } catch (err) {
        console.error('💥 Profile loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, refreshUser]);

  // Handle profile save
  const handleSave = async (updates: Partial<typeof user>, notifyTiers?: number[]) => {
    setSaving(true);
    setError(null);
    setNotificationSent(false);
    
    try {
      console.log('💾 Saving profile updates:', updates);
      
      // Update profile in database
      const updatedUser = await updateProfile(updates);
      
      // Update local state
      setLocalUser(updatedUser);
      
      // Refresh auth context
      await refreshUser();
      
      // Send tier notifications if specified
      if (notifyTiers && notifyTiers.length > 0) {
        console.log('📧 Sending tier notifications:', notifyTiers);
        await sendTierNotifications(notifyTiers, updatedUser);
        setNotificationSent(true);
      }
      
      setIsEditing(false);
      console.log('✅ Profile saved successfully');
      
    } catch (err) {
      console.error('💥 Profile save error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setError(errorMessage);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Handle retry loading profile
  const handleRetry = async () => {
    console.log('🔄 Retrying profile load...');
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    
    try {
      if (connectionStatus === 'disconnected') {
        console.log('🔌 Attempting to reconnect to Supabase...');
        const reconnected = await reconnectSupabase();
        if (!reconnected) {
          throw new Error('Failed to reconnect to Supabase');
        }
      }
      
      await refreshUser();
      const profileData = await getCurrentProfile();
      if (profileData) {
        setLocalUser(profileData);
      } else if (user) {
        setLocalUser(user);
      } else {
        throw new Error('Failed to load profile data');
      }
      console.log('✅ Profile retry successful');
    } catch (err) {
      console.error('💥 Profile retry error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Retry attempt: {retryCount}</p>
          )}
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !localUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Load Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={handleRetry}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </button>
            <a 
              href="/app/login" 
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign In Again
            </a>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-4">Retry attempts: {retryCount}</p>
          )}
        </div>
      </div>
    );
  }

  // Default fallback if no user data
  const displayUser = localUser || user || {
    id: 'temp-id',
    email: 'Loading...',
    name: 'Loading...',
    username: 'loading',
    onboardingComplete: false
  };

  console.log('🎨 Rendering Profile component with user:', displayUser.email);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-sm bg-red-100 text-red-800 rounded-md px-2 py-1 hover:bg-red-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Banner for Notifications */}
        {notificationSent && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-green-400">✓</div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Tier notifications sent successfully!
                </p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setNotificationSent(false)}
                  className="text-green-400 hover:text-green-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Actions */}
        <ProfileActions user={displayUser} onEdit={() => setIsEditing(true)} />

        {/* Profile Content */}
        {isEditing ? (
          <ProfileEdit 
            user={displayUser}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            saving={saving}
          />
        ) : (
          <ProfileView user={displayUser} onEdit={() => setIsEditing(true)} />
        )}
      </div>
    </div>
  );
}