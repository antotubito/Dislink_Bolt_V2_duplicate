import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UNIQUE_JOB_TITLES } from '../../types/jobTitles';
import { Industry, INDUSTRY_JOB_TITLES } from '../../types/industry';

interface JobTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  industry?: Industry;
  className?: string;
}

export function JobTitleInput({ 
  value, 
  onChange, 
  required = false, 
  industry,
  className = ""
}: JobTitleInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allSuggestions, setAllSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update suggestions when industry or search term changes
  useEffect(() => {
    let filteredTitles: string[];
    
    // If industry is provided, filter job titles by industry
    if (industry && INDUSTRY_JOB_TITLES[industry]) {
      filteredTitles = INDUSTRY_JOB_TITLES[industry];
    } else {
      filteredTitles = UNIQUE_JOB_TITLES;
    }
    
    // Store all suggestions for this industry
    setAllSuggestions(filteredTitles);
    
    // If there's a search term, filter further
    if (searchTerm.trim()) {
      filteredTitles = filteredTitles.filter(title =>
        title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Show all suggestions (no limit)
    setSuggestions(filteredTitles);
  }, [industry, searchTerm]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchTerm(newValue);
    setShowSuggestions(true);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSuggestionCount = () => {
    if (searchTerm.trim()) {
      return suggestions.length;
    }
    return allSuggestions.length;
  };

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
        Job Title
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
        <input
          ref={inputRef}
          type="text"
          id="jobTitle"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-600 sm:text-sm"
          placeholder="Enter or select your job title"
          required={required}
        />
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
          >
            <div className="py-1">
              {suggestions.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                  {searchTerm.trim() ? (
                    `Found ${suggestions.length} matching job titles`
                  ) : (
                    `Showing ${suggestions.length} job titles for ${industry ? INDUSTRY_JOB_TITLES[industry]?.length || 0 : 'all'} industries`
                  )}
                </div>
              )}
              {suggestions.map((title, index) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => handleSelectSuggestion(title)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                >
                  {title}
                </button>
              ))}
              {suggestions.length === 0 && searchTerm.trim() && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No job titles found matching "{searchTerm}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}