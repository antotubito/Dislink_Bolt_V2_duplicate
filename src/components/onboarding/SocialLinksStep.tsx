import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe, ArrowLeft, Sparkles, Users, Link, CheckCircle, AlertCircle } from 'lucide-react';
import { SocialPlatformSelector } from './SocialPlatformSelector';
import { SocialLinkInput } from './SocialLinkInput';
import { AnimatedButton } from './AnimatedButton';

interface SocialLinksStepProps {
  socialLinks: Record<string, string>;
  onUpdate: (links: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SocialLinksStep({ 
  socialLinks, 
  onUpdate, 
  onNext, 
  onBack 
}: SocialLinksStepProps) {
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validLinks, setValidLinks] = useState<Record<string, boolean>>({});
  const [hasAtLeastOneValidLink, setHasAtLeastOneValidLink] = useState(false);

  // Validate links on mount and when they change
  useEffect(() => {
    const newValidLinks: Record<string, boolean> = {};
    let hasValid = false;
    
    Object.entries(socialLinks).forEach(([platform, value]) => {
      const isValid = value.trim() !== '' && isValidLink(platform, value);
      newValidLinks[platform] = isValid;
      if (isValid) hasValid = true;
    });
    
    setValidLinks(newValidLinks);
    setHasAtLeastOneValidLink(hasValid);
  }, [socialLinks]);

  const isValidLink = (platform: string, value: string): boolean => {
    if (!value.trim()) return false; // Empty values are invalid
    
    // Basic validation patterns for common platforms
    const patterns: Record<string, RegExp> = {
      linkedin: /^https:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/,
      twitter: /^@[\w]{1,15}$|^https:\/\/(www\.)?twitter\.com\/[\w]{1,15}\/?$/,
      github: /^https:\/\/(www\.)?github\.com\/[\w-]+\/?$/,
      instagram: /^@[\w.]+$|^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/,
      facebook: /^https:\/\/(www\.)?facebook\.com\/[\w.]+\/?$/,
      portfolio: /^https?:\/\/.+/
    };
    
    // If we have a pattern for this platform, test it
    if (patterns[platform]) {
      return patterns[platform].test(value);
    }
    
    // For other platforms, just ensure it's not empty
    return value.trim() !== '';
  };

  const handleAddPlatform = (platform: string) => {
    if (socialLinks[platform]) {
      setError(`You've already added ${platform}`);
      return;
    }
    
    const updatedLinks = {
      ...socialLinks,
      [platform]: ''
    };
    
    onUpdate(updatedLinks);
    setShowPlatformSelector(false);
    setError(null);
  };

  const handleRemovePlatform = (platform: string) => {
    const updatedLinks = { ...socialLinks };
    delete updatedLinks[platform];
    onUpdate(updatedLinks);
  };

  const handleUpdatePlatform = (platform: string, value: string) => {
    onUpdate({
      ...socialLinks,
      [platform]: value
    });
  };

  const handleContinue = () => {
    // Check if at least one valid link is provided
    if (!hasAtLeastOneValidLink) {
      setError('Please add at least one social platform to continue');
      return;
    }
    
    // Check if any links are invalid
    const hasInvalidLinks = Object.entries(validLinks).some(([platform, isValid]) => !isValid);
    
    if (hasInvalidLinks) {
      setError('Please fix the invalid social links before continuing');
      return;
    }
    
    // Filter out empty links
    const filteredLinks = Object.entries(socialLinks)
      .filter(([_, value]) => value.trim() !== '')
      .reduce((acc, [key, value]) => ({
        ...acc,
        [key]: value
      }), {});
    
    // Update with filtered links
    onUpdate(filteredLinks);
    
    // Clear error and continue
    setError(null);
    onNext();
  };

  const getValidLinksCount = () => {
    return Object.values(validLinks).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      {/* Header with motivation */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="relative">
            <Globe className="h-12 w-12 text-indigo-600" />
            <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your World! 🌎
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Add your social platforms to make it easier for people to discover and connect with you
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Platforms Added</span>
          <span className="text-sm text-indigo-600 font-semibold">
            {getValidLinksCount()} / 3+ recommended
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((getValidLinksCount() / 3) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {getValidLinksCount() === 0 
            ? "Start by adding your first platform" 
            : getValidLinksCount() === 1 
            ? "Great! Add a couple more for better visibility"
            : "Excellent! You're well connected"}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Social links section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Your Social Platforms</h3>
            <p className="text-sm text-gray-500">
              {getValidLinksCount() > 0 
                ? `${getValidLinksCount()} platform${getValidLinksCount() > 1 ? 's' : ''} added`
                : "No platforms added yet"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPlatformSelector(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Platform
          </button>
        </div>

        {Object.keys(socialLinks).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Users className="h-12 w-12 text-indigo-500" />
                <Link className="h-6 w-6 text-purple-500 absolute -bottom-1 -right-1" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Connect? 🚀
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Add your social platforms to help others discover and connect with you. 
              At least one platform is required to continue.
            </p>
            <button
              type="button"
              onClick={() => setShowPlatformSelector(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Platform
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {Object.entries(socialLinks).map(([platform, value]) => (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <SocialLinkInput
                    platform={platform}
                    value={value}
                    onChange={(newValue) => handleUpdatePlatform(platform, newValue)}
                    onRemove={() => handleRemovePlatform(platform)}
                    autoFocus={value === ''}
                    isValid={validLinks[platform] !== false}
                  />
                  {validLinks[platform] && value.trim() !== '' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Benefits section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-1">Why add social platforms?</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Help others discover your work and interests</li>
              <li>• Build credibility and trust with connections</li>
              <li>• Make it easier for people to reach out</li>
              <li>• Show your personality and expertise</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex space-x-3 pt-4">
        <AnimatedButton
          variant="secondary"
          onClick={onBack}
          icon={ArrowLeft}
        >
          Back
        </AnimatedButton>
        <AnimatedButton
          onClick={handleContinue}
          disabled={!hasAtLeastOneValidLink}
          className={hasAtLeastOneValidLink ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600" : ""}
        >
          {hasAtLeastOneValidLink ? 'Continue' : 'Add at least 1 platform'}
        </AnimatedButton>
      </div>

      {/* Platform selector modal */}
      <AnimatePresence>
        {showPlatformSelector && (
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
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <SocialPlatformSelector
                onSelect={handleAddPlatform}
                onClose={() => setShowPlatformSelector(false)}
                selectedPlatforms={Object.keys(socialLinks)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}