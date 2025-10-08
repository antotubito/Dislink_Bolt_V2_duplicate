import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Users, 
  Brain, 
  Eye, 
  Sun, 
  Shield, 
  Wand2,
  Plus,
  X,
  Award
} from 'lucide-react';
import { assignBadges, removeBadge, getAvailableBadges } from '@dislink/shared/lib/contacts';
import { logger } from '@dislink/shared/lib/logger';
import type { Contact } from '@dislink/shared/types/contact';

interface ContactBadgesProps {
  contact: Contact;
  onBadgesUpdate: (badges: string[]) => void;
  canEdit?: boolean;
}

const BADGE_ICONS: Record<string, React.ElementType> = {
  'vibe-setter': Sparkles,
  'energy-booster': Zap,
  'smooth-operator': Users,
  'idea-spark': Brain,
  'detail-ninja': Eye,
  'mood-maven': Sun,
  'reliable-one': Shield,
  'wildcard-wizard': Wand2
};

const BADGE_COLORS: Record<string, string> = {
  'vibe-setter': 'bg-purple-100 text-purple-800 border-purple-200',
  'energy-booster': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'smooth-operator': 'bg-blue-100 text-blue-800 border-blue-200',
  'idea-spark': 'bg-orange-100 text-orange-800 border-orange-200',
  'detail-ninja': 'bg-green-100 text-green-800 border-green-200',
  'mood-maven': 'bg-pink-100 text-pink-800 border-pink-200',
  'reliable-one': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'wildcard-wizard': 'bg-cyan-100 text-cyan-800 border-cyan-200'
};

export function ContactBadges({ contact, onBadgesUpdate, canEdit = true }: ContactBadgesProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const availableBadges = getAvailableBadges();
  const currentBadges = contact.badges || [];
  const availableToAdd = availableBadges.filter(badge => !currentBadges.includes(badge.id));

  const handleAddBadges = async () => {
    if (selectedBadges.length === 0) return;

    setLoading(true);
    try {
      const newBadges = [...currentBadges, ...selectedBadges];
      await assignBadges(contact.id, newBadges);
      onBadgesUpdate(newBadges);
      setSelectedBadges([]);
      setShowAddModal(false);
      logger.info('Badges added successfully:', { contactId: contact.id, badges: selectedBadges });
    } catch (error) {
      logger.error('Error adding badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBadge = async (badgeToRemove: string) => {
    setLoading(true);
    try {
      await removeBadge(contact.id, badgeToRemove);
      const updatedBadges = currentBadges.filter(badge => badge !== badgeToRemove);
      onBadgesUpdate(updatedBadges);
      logger.info('Badge removed successfully:', { contactId: contact.id, badge: badgeToRemove });
    } catch (error) {
      logger.error('Error removing badge:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBadgeSelection = (badgeId: string) => {
    setSelectedBadges(prev =>
      prev.includes(badgeId)
        ? prev.filter(id => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  const getBadgeInfo = (badgeId: string) => {
    return availableBadges.find(badge => badge.id === badgeId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Award className="h-5 w-5 mr-2 text-purple-600" />
          Badges
        </h3>
        {canEdit && availableToAdd.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Badge
          </button>
        )}
      </div>

      {/* Current Badges */}
      <div className="flex flex-wrap gap-2">
        {currentBadges.length === 0 ? (
          <p className="text-gray-500 text-sm">No badges assigned yet</p>
        ) : (
          currentBadges.map((badgeId) => {
            const badgeInfo = getBadgeInfo(badgeId);
            const Icon = BADGE_ICONS[badgeId];
            const colorClass = BADGE_COLORS[badgeId];

            if (!badgeInfo || !Icon) return null;

            return (
              <motion.div
                key={badgeId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${colorClass}`}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                <span>{badgeInfo.name}</span>
                {canEdit && (
                  <button
                    onClick={() => handleRemoveBadge(badgeId)}
                    disabled={loading}
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Badge Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Badges</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Choose badges that reflect your interaction with {contact.name}
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableToAdd.map((badge) => {
                    const Icon = BADGE_ICONS[badge.id];
                    const colorClass = BADGE_COLORS[badge.id];
                    const isSelected = selectedBadges.includes(badge.id);

                    return (
                      <motion.div
                        key={badge.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleBadgeSelection(badge.id)}
                        className={`cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isSelected ? 'bg-purple-500 text-white' : colorClass
                          }`}>
                            {Icon && <Icon className="h-5 w-5" />}
                          </div>
                          <div>
                            <h4 className={`font-medium ${
                              isSelected ? 'text-purple-700' : 'text-gray-900'
                            }`}>
                              {badge.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {badge.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBadges}
                    disabled={selectedBadges.length === 0 || loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : `Add ${selectedBadges.length} Badge${selectedBadges.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
