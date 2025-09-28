import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Building2, Briefcase, Calendar, Heart,
  Globe, Camera, Sparkles, LinkIcon, LogOut, Check, ArrowLeft, X
} from 'lucide-react';
import { OnboardingStep } from "@dislink/shared/components/onboarding/OnboardingStep";
import { AnimatedInput } from "@dislink/shared/components/ui/AnimatedInput";
import { AnimatedButton } from "@dislink/shared/components/ui/AnimatedButton";
import { EnhancedSocialLinksInput } from '@dislink/shared/components/EnhancedSocialLinksInput';
import { updateProfile } from '@dislink/shared/lib/profile';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '@dislink/shared/lib/supabase';
import { Industry } from '@dislink/shared/types';
import { completeOnboarding } from '@dislink/shared/lib/authFlow';
import { 
  LazyEnhancedSocialPlatforms, 
  LazyLocationStep, 
  LazyFaceVerification, 
  LazyJobTitleInput, 
  LazyIndustrySelect, 
  LazyCodeInvitationModal,
  LazyLoadingFallback 
} from '../components/lazy';
import { Suspense } from 'react';

type OnboardingStep = 'welcome' | 'basics' | 'work' | 'location' | 'photo' | 'social' | 'complete';

const STEPS = ['welcome', 'basics', 'work', 'location', 'photo', 'social', 'complete'] as const;

function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCodeInvitation, setShowCodeInvitation] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    birthday: '',
    jobTitle: user?.jobTitle || '',
    company: user?.company || '',
    industry: user?.industry || undefined as Industry | undefined,
    location: user?.bio?.location || '',
    from: user?.bio?.from || '',
    profileImage: user?.profileImage || '',
    socialLinks: user?.socialLinks || {}
  });

  const currentStepIndex = STEPS.indexOf(step) + 1;
  const totalSteps = STEPS.length;

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/app/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', session.user.id)
          .single();

        if (profile?.onboarding_complete) {
          navigate('/app');
        }
      } catch (error) {
        console.error('Error checking onboarding access:', error);
        navigate('/app/login');
      }
    }

    checkAccess();
  }, []);

  useEffect(() => {
    // Removed saved progress loading for security reasons
    // Progress is now cleared when user exits onboarding
  }, []);

  useEffect(() => {
    if (step !== 'complete') {
      const currentProgress = {
        step,
        formData
      };
      localStorage.setItem('onboarding_progress', JSON.stringify(currentProgress));
    }
  }, [step, formData]);

  const handleLocationUpdate = (locationData: { location: string; from: string }) => {
    setFormData({
      ...formData,
      location: locationData.location,
      from: locationData.from
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎯 Starting onboarding completion...');

      // Get current session to ensure we have the user ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('🎯 Completing onboarding with enhanced flow...');
      await completeOnboarding(session.user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthday: formData.birthday,
        jobTitle: formData.jobTitle,
        company: formData.company,
        industry: formData.industry,
        profileImage: formData.profileImage,
        socialLinks: formData.socialLinks,
        bio: {
          location: formData.location,
          from: formData.from,
          about: ''
        }
      });

      console.log('🎯 Onboarding completed successfully, clearing progress...');
      localStorage.removeItem('onboarding_progress');

      console.log('🎯 Moving to complete step...');
      setStep('complete');
    } catch (err) {
      console.error('Onboarding completion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      // Wait for user refresh to complete and ensure profile is updated
      await refreshUser();

      // Add a small delay to ensure all state is synchronized
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show Code Invitation modal instead of navigating directly
      setShowCodeInvitation(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError('Failed to complete onboarding');
    }
  };

  const handleCodeInvitationSuccess = async (connectionDetails: any) => {
    try {
      // Connection was successful, refresh user data and navigate to app
      console.log('Code invitation successful:', connectionDetails);

      // Ensure user data is fully refreshed before navigation
      await refreshUser();

      // Add a small delay to ensure all state is synchronized
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('🎯 Navigating to app after successful code invitation');
      navigate('/app');
    } catch (error) {
      console.error('Error during success navigation:', error);
      // Fallback navigation even if refresh fails
      navigate('/app');
    }
  };

  const handleCodeInvitationSkip = async () => {
    try {
      // Ensure user data is fully refreshed before navigation
      await refreshUser();

      // Add a small delay to ensure all state is synchronized
      await new Promise(resolve => setTimeout(resolve, 300));

      // User skipped or doesn't have invitation, navigate to app normally
      console.log('🎯 Navigating to app after skipping code invitation');
      navigate('/app');
    } catch (error) {
      console.error('Error during skip navigation:', error);
      // Fallback navigation even if refresh fails
      navigate('/app');
    }
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = async () => {
    try {
      // Sign out the user for security
      await supabase.auth.signOut();

      // Clear any stored progress
      localStorage.removeItem('onboarding_progress');

      // Redirect to login page
      navigate('/app/login');
    } catch (error) {
      console.error('Error during exit:', error);
      // Fallback to home page if sign out fails
      navigate('/');
    }
  };

  const handlePhotoCapture = (photoData: string) => {
    setFormData(prev => ({ ...prev, profileImage: photoData }));
    setError(null);
  };

  const handlePhotoError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const validateBasicInfo = () => {
    if (!formData.birthday) {
      setError('Birthday is required');
      return false;
    }

    const age = calculateAge(formData.birthday);
    if (age < 12) {
      setError('You must be at least 12 years old to use this app');
      return false;
    }

    return true;
  };

  const handleBasicsSubmit = () => {
    setError(null);
    if (validateBasicInfo()) {
      setStep('work');
    }
  };

  const handleSocialLinksUpdate = (links: Record<string, string>) => {
    console.log('🔧 Onboarding: handleSocialLinksUpdate called with:', links);
    setFormData(prev => {
      const updated = {
        ...prev,
        socialLinks: links
      };
      console.log('🔧 Onboarding: Updated formData:', updated);
      return updated;
    });
  };

  const renderWelcomeStep = () => (
    <OnboardingStep
      title="Welcome to Dislink! 🎉"
      description="Let's get your profile set up in just a few steps"
      icon={Sparkles}
      step={currentStepIndex}
      totalSteps={totalSteps}
    >
      <div className="space-y-6">
        <p className="text-gray-600">
          We're excited to help you build meaningful connections! This quick setup will help others find and connect with you.
        </p>
        <AnimatedButton onClick={() => setStep('basics')}>
          Let's Get Started
        </AnimatedButton>
      </div>
    </OnboardingStep>
  );

  const renderBasicsStep = () => (
    <OnboardingStep
      title="Nice to meet you! 👋"
      description="Tell us a bit more about yourself"
      icon={User}
      step={currentStepIndex}
      totalSteps={totalSteps}
      error={error}
    >
      <div className="space-y-6">
        {/* Display user info as read-only */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Your Name</span>
            </div>
            <p className="text-gray-900 font-medium">
              {formData.firstName} {formData.lastName}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Your Email</span>
            </div>
            <p className="text-gray-900 font-medium">{formData.email}</p>
          </div>
        </div>

        <div>
          <AnimatedInput
            label="When's your birthday?"
            icon={Calendar}
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            required
            max={new Date().toISOString().split('T')[0]}
          />
          <p className="mt-1 text-sm text-gray-500">
            You must be at least 12 years old to use Dislink
          </p>
        </div>

        <div className="flex space-x-3">
          <AnimatedButton
            variant="secondary"
            onClick={() => setStep('welcome')}
            icon={ArrowLeft}
          >
            Back
          </AnimatedButton>
          <AnimatedButton
            onClick={handleBasicsSubmit}
          >
            Continue
          </AnimatedButton>
        </div>
      </div>
    </OnboardingStep>
  );

  const renderWorkStep = () => (
    <OnboardingStep
      title="What do you do? 💼"
      description="Tell us about your work and interests"
      icon={Briefcase}
      step={currentStepIndex}
      totalSteps={totalSteps}
    >
      <div className="space-y-6">
        <Suspense fallback={<LazyLoadingFallback />}>
          <LazyIndustrySelect
            value={formData.industry}
            onChange={(industry) => setFormData({ ...formData, industry })}
            required
          />
        </Suspense>

        <Suspense fallback={<LazyLoadingFallback />}>
          <LazyJobTitleInput
            value={formData.jobTitle}
            onChange={(value) => setFormData({ ...formData, jobTitle: value })}
            industry={formData.industry}
            required
          />
        </Suspense>

        <AnimatedInput
          label="Company (optional)"
          icon={Building2}
          placeholder="Where do you work?"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />
        <div className="flex space-x-3">
          <AnimatedButton
            variant="secondary"
            onClick={() => setStep('basics')}
            icon={ArrowLeft}
          >
            Back
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setStep('location')}
            disabled={!formData.jobTitle}
          >
            Continue
          </AnimatedButton>
        </div>
      </div>
    </OnboardingStep>
  );

  const renderLocationStep = () => (
    <OnboardingStep
      title="Where in the world? 🌎"
      description="Tell us where you're based"
      icon={Globe}
      step={currentStepIndex}
      totalSteps={totalSteps}
      error={error}
    >
      <Suspense fallback={<LazyLoadingFallback />}>
        <LazyLocationStep
          location={formData.location}
          from={formData.from}
          onUpdate={handleLocationUpdate}
          onNext={() => setStep('photo')}
          onBack={() => setStep('work')}
        />
      </Suspense>
    </OnboardingStep>
  );

  const renderPhotoStep = () => (
    <OnboardingStep
      title="Show us your smile! 📸"
      description="Add a profile photo with your face clearly visible (required)"
      icon={Camera}
      step={currentStepIndex}
      totalSteps={totalSteps}
    >
      <div className="space-y-6">
        <Suspense fallback={<LazyLoadingFallback />}>
          <LazyFaceVerification
            onVerified={handlePhotoCapture}
            onError={handlePhotoError}
          />
        </Suspense>

        <div className="flex space-x-3">
          <AnimatedButton
            variant="secondary"
            onClick={() => setStep('location')}
            icon={ArrowLeft}
          >
            Back
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setStep('social')}
            disabled={!formData.profileImage}
          >
            Continue
          </AnimatedButton>
        </div>
      </div>
    </OnboardingStep>
  );

  const renderSocialStep = () => (
    <OnboardingStep
      title="Connect your world! 🌎"
      description="Add your social profiles to make connecting easier"
      icon={Globe}
      step={currentStepIndex}
      totalSteps={totalSteps}
      error={error}
    >
      <div className="space-y-6">
        <EnhancedSocialLinksInput
          links={formData.socialLinks}
          onChange={handleSocialLinksUpdate}
          required={true}
          minLinks={1}
          recommendedLinks={3}
          showPreview={true}
          allowCustomPlatforms={true}
        />

        <div className="flex space-x-3 pt-4">
          <AnimatedButton
            variant="secondary"
            onClick={() => setStep('photo')}
            icon={ArrowLeft}
          >
            Back
          </AnimatedButton>
          <AnimatedButton
            onClick={handleComplete}
            disabled={Object.keys(formData.socialLinks).length === 0}
          >
            Complete Setup
          </AnimatedButton>
        </div>
      </div>
    </OnboardingStep>
  );

  const renderCompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="bg-gradient-to-br from-white to-indigo-50 p-8 rounded-2xl shadow-2xl border border-indigo-100">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="mx-auto w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-lg"
        >
          <Check className="h-12 w-12 text-white" />
        </motion.div>

        {/* Celebration Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Dislink! 🎉
          </h2>

          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Your profile is all set up and ready to go. You're now part of a community of amazing people building meaningful connections!
          </p>
        </motion.div>

        {/* What's Next Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-4 text-lg">What's Next? 🚀</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-indigo-900 mb-1">Explore Your Dashboard</h4>
                  <p className="text-sm text-indigo-700">Discover your personalized experience and start connecting</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 mb-1">Connect with People</h4>
                  <p className="text-sm text-purple-700">Find and connect with people you know and want to meet</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-1">Share Your Profile</h4>
                  <p className="text-sm text-green-700">Share your unique profile link with others</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Build Relationships</h4>
                  <p className="text-sm text-yellow-700">Grow your network and build meaningful connections</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-white p-4 rounded-lg border border-gray-200"
            >
              <div className="text-2xl font-bold text-indigo-600">100%</div>
              <div className="text-xs text-gray-500">Profile Complete</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white p-4 rounded-lg border border-gray-200"
            >
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-xs text-gray-500">Connections Possible</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="bg-white p-4 rounded-lg border border-gray-200"
            >
              <div className="text-2xl font-bold text-green-600">24/7</div>
              <div className="text-xs text-gray-500">Always Available</div>
            </motion.div>
          </div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <AnimatedButton
              onClick={handleFinish}
              className="btn-captamundi-primary w-full"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Start Your Journey
            </AnimatedButton>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto relative">
        {step !== 'complete' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExit}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </motion.button>
        )}

        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Exit Onboarding?
                </h3>
                <p className="text-gray-600 mb-6">
                  For security reasons, you'll be signed out and will need to sign in again to continue. Your progress will be saved.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmExit}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Exit & Sign Out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 'welcome' && renderWelcomeStep()}
          {step === 'basics' && renderBasicsStep()}
          {step === 'work' && renderWorkStep()}
          {step === 'location' && renderLocationStep()}
          {step === 'photo' && renderPhotoStep()}
          {step === 'social' && renderSocialStep()}
          {step === 'complete' && renderCompleteStep()}
        </AnimatePresence>

        {/* Code Invitation Modal */}
        <Suspense fallback={<LazyLoadingFallback />}>
          <LazyCodeInvitationModal
            isOpen={showCodeInvitation}
            onClose={() => setShowCodeInvitation(false)}
            onSuccess={handleCodeInvitationSuccess}
            onSkip={handleCodeInvitationSkip}
          />
        </Suspense>
      </div>
    </div>
  );
}