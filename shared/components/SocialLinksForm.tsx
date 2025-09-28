import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ExternalLink, AlertCircle, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import { useSocialLinks, type SocialLink } from '../../hooks/useSocialLinks';
import { logger } from '../../lib/logger';

interface SocialLinksFormProps {
  initialLinks?: Record<string, string>;
  onUpdate: (links: Record<string, string>) => void;
  onError?: (errors: Record<string, string>) => void;
  required?: boolean;
  minLinks?: number;
  recommendedLinks?: number;
  className?: string;
  disabled?: boolean;
}

// Available platforms
const AVAILABLE_PLATFORMS = [
  { key: 'linkedin', name: 'LinkedIn', icon: '🔗' },
  { key: 'github', name: 'GitHub', icon: '🐙' },
  { key: 'twitter', name: 'Twitter/X', icon: '🐦' },
  { key: 'instagram', name: 'Instagram', icon: '📷' },
  { key: 'facebook', name: 'Facebook', icon: '👥' },
  { key: 'youtube', name: 'YouTube', icon: '📺' },
  { key: 'tiktok', name: 'TikTok', icon: '🎵' },
  { key: 'snapchat', name: 'Snapchat', icon: '👻' },
  { key: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  { key: 'telegram', name: 'Telegram', icon: '✈️' },
  { key: 'discord', name: 'Discord', icon: '🎮' },
  { key: 'medium', name: 'Medium', icon: '📝' },
  { key: 'substack', name: 'Substack', icon: '📰' },
  { key: 'twitch', name: 'Twitch', icon: '🎮' },
  { key: 'portfolio', name: 'Portfolio', icon: '🌐' },
  { key: 'website', name: 'Website', icon: '🌐' }
];

export function SocialLinksForm({
  initialLinks = {},
  onUpdate,
  onError,
  required = false,
  minLinks = 1,
  recommendedLinks = 3,
  className = '',
  disabled = false
}: SocialLinksFormProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const {
    links,
    errors,
    isValid,
    hasChanges,
    addLink,
    updateLink,
    removeLink,
    clearErrors,
    validateLink,
    getPlaceholder
  } = useSocialLinks({
    initialLinks,
    onUpdate,
    onError,
    validateOnChange: true,
    debounceMs: 300
  });

  // Get available platforms (exclude already added ones)
  const availablePlatforms = AVAILABLE_PLATFORMS.filter(
    platform => !links.some(link => link.platform === platform.key)
  );

  // Handle adding a new link
  const handleAddLink = async () => {
    if (!selectedPlatform || !inputValue.trim()) return;

    const success = await addLink(selectedPlatform, inputValue);
    if (success) {
      setSelectedPlatform('');
      setInputValue('');
      setShowAddForm(false);
      clearErrors();
    }
  };

  // Handle updating an existing link
  const handleUpdateLink = async (id: string) => {
    if (!editingValue.trim()) return;

    const success = await updateLink(id, editingValue);
    if (success) {
      setEditingId(null);
      setEditingValue('');
      clearErrors();
    }
  };

  // Handle removing a link
  const handleRemoveLink = (id: string) => {
    removeLink(id);
  };

  // Start editing a link
  const startEditing = (link: SocialLink) => {
    setEditingId(link.id);
    setEditingValue(link.username || link.url);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
    clearErrors();
  };

  // Validate input in real-time
  const validateInput = (platform: string, value: string) => {
    if (!value.trim()) return { isValid: true };
    return validateLink(platform, value);
  };

  // Get validation for current input
  const currentValidation = selectedPlatform && inputValue 
    ? validateInput(selectedPlatform, inputValue)
    : { isValid: true };

  // Check if we meet minimum requirements
  const meetsMinimum = links.length >= minLinks;
  const meetsRecommended = links.length >= recommendedLinks;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with requirements */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Social Links
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          <div className="text-sm text-gray-500">
            {links.length} link{links.length !== 1 ? 's' : ''} added
          </div>
        </div>
        
        {/* Requirements indicator */}
        <div className="flex items-center space-x-4 text-sm">
          <div className={`flex items-center space-x-1 ${meetsMinimum ? 'text-green-600' : 'text-red-500'}`}>
            {meetsMinimum ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>Minimum {minLinks} required</span>
          </div>
          <div className={`flex items-center space-x-1 ${meetsRecommended ? 'text-green-600' : 'text-yellow-600'}`}>
            {meetsRecommended ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>Recommended {recommendedLinks}+</span>
          </div>
        </div>
      </div>

      {/* Current links */}
      <div className="space-y-2">
        <AnimatePresence>
          {links.map((link) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
            >
              <span className="text-lg">
                {AVAILABLE_PLATFORMS.find(p => p.key === link.platform)?.icon || '🔗'}
              </span>
              
              <div className="flex-1 min-w-0">
                {editingId === link.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      placeholder={getPlaceholder(link.platform)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={disabled}
                    />
                    {errors[link.id] && (
                      <p className="text-sm text-red-500">{errors[link.id]}</p>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateLink(link.id)}
                        disabled={disabled || !editingValue.trim()}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={disabled}
                        className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-gray-900">
                      {AVAILABLE_PLATFORMS.find(p => p.key === link.platform)?.name || link.platform}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {link.displayName}
                    </div>
                    {link.url && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <span>View profile</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {editingId !== link.id && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => startEditing(link)}
                    disabled={disabled}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:cursor-not-allowed"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveLink(link.id)}
                    disabled={disabled}
                    className="p-1 text-gray-400 hover:text-red-600 disabled:cursor-not-allowed"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add new link form */}
      {showAddForm && availablePlatforms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled}
              >
                <option value="">Choose a platform...</option>
                {availablePlatforms.map((platform) => (
                  <option key={platform.key} value={platform.key}>
                    {platform.icon} {platform.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlatform && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username or URL
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={getPlaceholder(selectedPlatform)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !currentValidation.isValid ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={disabled}
                />
                {!currentValidation.isValid && (
                  <p className="mt-1 text-sm text-red-500">{currentValidation.message}</p>
                )}
                {currentValidation.isValid && inputValue.trim() && (
                  <p className="mt-1 text-sm text-green-600">
                    ✓ Valid format for {AVAILABLE_PLATFORMS.find(p => p.key === selectedPlatform)?.name}
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleAddLink}
                disabled={disabled || !selectedPlatform || !inputValue.trim() || !currentValidation.isValid}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Link
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedPlatform('');
                  setInputValue('');
                  clearErrors();
                }}
                disabled={disabled}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add button */}
      {!showAddForm && availablePlatforms.length > 0 && (
        <button
          onClick={() => setShowAddForm(true)}
          disabled={disabled}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          <span>Add Social Link</span>
        </button>
      )}

      {/* No more platforms available */}
      {availablePlatforms.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>All available platforms have been added.</p>
        </div>
      )}

      {/* Overall validation status */}
      {hasChanges && (
        <div className="text-sm text-gray-600">
          {isValid ? (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>All links are valid</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span>Please fix validation errors</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
