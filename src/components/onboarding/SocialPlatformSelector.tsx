import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, ChevronRight, X, Globe } from 'lucide-react';
import { SOCIAL_CATEGORIES } from '../../config/social';

interface SocialPlatformSelectorProps {
  onSelect: (platform: string) => void;
  onClose: () => void;
  selectedPlatforms: string[];
}

export function SocialPlatformSelector({ 
  onSelect, 
  onClose,
  selectedPlatforms
}: SocialPlatformSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter platforms based on search query
  const filteredCategories = Object.entries(SOCIAL_CATEGORIES)
    .filter(([_, category]) => {
      if (!searchQuery) return true;
      
      // Check if category title matches
      if (category.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }
      
      // Check if any platform in the category matches
      return Object.entries(category.links).some(([_, config]) => 
        config.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  // Get all platforms for search results
  const getAllPlatforms = () => {
    const allPlatforms: Array<{
      platform: string;
      config: any;
      categoryId: string;
      category: any;
    }> = [];
    
    Object.entries(SOCIAL_CATEGORIES).forEach(([categoryId, category]) => {
      Object.entries(category.links).forEach(([platform, config]) => {
        allPlatforms.push({
          platform,
          config,
          categoryId,
          category
        });
      });
    });
    
    return allPlatforms;
  };

  // Filter platforms for search
  const getFilteredPlatforms = () => {
    if (!searchQuery.trim()) return [];
    
    return getAllPlatforms().filter(({ config, category }) => {
      const matchesPlatform = config.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlatform || matchesCategory;
    });
  };

  const handleSelectPlatform = (platform: string) => {
    onSelect(platform);
    onClose();
  };

  const filteredPlatforms = getFilteredPlatforms();
  const hasSearchResults = searchQuery.trim() && filteredPlatforms.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg max-h-[80vh] flex flex-col overflow-hidden">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add Social Platform</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search platforms (e.g., Instagram, LinkedIn)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories and platforms */}
      <div className="flex-1 overflow-y-auto">
        {hasSearchResults ? (
          // Show search results
          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Search Results</h4>
              <p className="text-xs text-gray-400">Found {filteredPlatforms.length} platform{filteredPlatforms.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="space-y-2">
              {filteredPlatforms.map(({ platform, config, categoryId, category }) => {
                const isSelected = selectedPlatforms.includes(platform);
                return (
                  <motion.div
                    key={platform}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectPlatform(platform)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-50 border border-indigo-200' 
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <div 
                        className="p-2 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <config.icon 
                          className="h-5 w-5"
                          style={{ color: config.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{config.label}</h4>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {category.title}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{config.placeholder}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="bg-indigo-100 p-1 rounded-full ml-2">
                        <Check className="h-4 w-4 text-indigo-600" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : selectedCategory ? (
          // Show platforms in selected category
          <div className="p-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center text-sm text-indigo-600 mb-4 hover:text-indigo-700"
            >
              <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to categories
            </button>
            
            <div className="space-y-2">
              {Object.entries(SOCIAL_CATEGORIES[selectedCategory].links)
                .filter(([_, config]) => {
                  if (!searchQuery) return true;
                  return config.label.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map(([platform, config]) => {
                  const isSelected = selectedPlatforms.includes(platform);
                  return (
                    <motion.div
                      key={platform}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSelectPlatform(platform)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-indigo-50 border border-indigo-200' 
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div 
                          className="p-2 rounded-full mr-3"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <config.icon 
                            className="h-5 w-5"
                            style={{ color: config.color }}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{config.label}</h4>
                          <p className="text-sm text-gray-500">{config.placeholder}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="bg-indigo-100 p-1 rounded-full">
                          <Check className="h-4 w-4 text-indigo-600" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ) : (
          // Show categories with platform previews
          <div className="p-4 space-y-4">
            {filteredCategories.map(([categoryId, category]) => (
              <motion.div
                key={categoryId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedCategory(categoryId)}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-all hover:shadow-sm"
              >
                <div className="flex items-center flex-1">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${category.color} mr-4 flex-shrink-0`}>
                    <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{category.title}</h3>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(category.links).slice(0, 4).map(([platform, config]) => (
                        <span
                          key={platform}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          <config.icon 
                            className="h-3 w-3 mr-1"
                            style={{ color: config.color }}
                          />
                          {config.label}
                        </span>
                      ))}
                      {Object.keys(category.links).length > 4 && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{Object.keys(category.links).length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}