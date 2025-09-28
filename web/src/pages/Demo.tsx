import React, { useState, useEffect } from 'react';
import { CityAutocompleteDemo } from '../components/common/CityAutocompleteDemo';
import { userPreferences } from "@dislink/shared/lib/userPreferences"';
import { Location } from '../types/location';
import { useAuth } from '../components/auth/AuthProvider';
import { CosmicThemeSelector, CosmicThemeSelectorCard } from '../components/cosmic/CosmicThemeSelector';
import { useCosmicTheme } from '../lib/cosmicThemes';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Heart, Palette, Star } from 'lucide-react';

export function Demo() {
  const { user } = useAuth();
  const { currentTheme, currentPalette } = useCosmicTheme();
  const [language, setLanguage] = useState('en');
  const [savedLocations, setSavedLocations] = useState<Record<string, Location | null>>({});
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<Location[]>([]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    console.log(`Language changed to: ${newLanguage}`);
  };

  // Load saved locations and recent searches on mount
  useEffect(() => {
    const loadSavedData = async () => {
      setLoading(true);
      try {
        // Load location preferences
        const currentLocation = await userPreferences.getLocationPreference('location');
        const hometown = await userPreferences.getLocationPreference('from');

        setSavedLocations({
          location: currentLocation,
          from: hometown
        });

        // Load recent searches
        const savedSearches = localStorage.getItem('recentLocationSearches');
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }
      } catch (err) {
        console.error('Error loading saved data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSavedData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🌌 Dislink Component Demos
        </h1>
        <p className="text-gray-600">
          Explore our cosmic design system and interactive components
        </p>
      </motion.div>

      {/* Cosmic Theme Showcase */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Cosmic Theme System
              </h2>
              <p className="text-sm text-gray-600">
                Three philosophical color palettes for your constellation of relationships
              </p>
            </div>
          </div>

          {/* Current Theme Display */}
          <motion.div
            key={currentTheme}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="from-purple-500 to-indigo-600 rounded-lg p-6 mb-6 text-white"
          >
            <div className="flex items-center gap-3 mb-3">
              {currentTheme === 'nebula' && <Sparkles className="h-6 w-6" />}
              {currentTheme === 'aurora' && <Zap className="h-6 w-6" />}
              {currentTheme === 'starlight' && <Heart className="h-6 w-6" />}
              <div>
                <h3 className="text-xl font-semibold">{currentPalette.name}</h3>
                <p className="text-white/80">{currentPalette.description}</p>
              </div>
            </div>
            <p className="text-white/90 italic text-sm mb-4">
              "{currentPalette.philosophy}"
            </p>

            {/* Color Palette Display */}
            <div className="flex gap-3">
              {Object.entries(currentPalette.colors).map(([key, color]) => (
                <div
                  key={key}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white/30"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-white/70 capitalize">{key}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Theme Selector */}
          <CosmicThemeSelector className="mb-6" />

          {/* Cosmic Components Demo */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Primary Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-captamundi-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25"
            >
              Primary Action
            </motion.button>

            {/* Secondary Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Secondary Action
            </motion.button>

            {/* Accent Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-indigo-600 text-gray-900 p-4 rounded-lg"
            >
              <Star className="h-5 w-5 mb-2" />
              <p className="font-medium">Accent Element</p>
              <p className="text-sm opacity-80">Warm touches and highlights</p>
            </motion.div>

            {/* Pop Alert */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-pink-600 text-white p-4 rounded-lg"
            >
              <Zap className="h-5 w-5 mb-2" />
              <p className="font-medium">Pop Alert</p>
              <p className="text-sm opacity-90">Energy moments and notifications</p>
            </motion.div>
          </div>
        </div>

        {/* Card Version Theme Selector */}
        <CosmicThemeSelectorCard />
      </motion.section>

      {/* Existing Demo Content */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          City Autocomplete Component
        </h2>
        <div className="bg-indigo-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-indigo-700">
            This component uses <strong>OpenStreetMap's Nominatim API</strong> to search for cities worldwide, including small towns and villages.
            It falls back to a local database when offline or when the API is unavailable.
          </p>
        </div>
        <CityAutocompleteDemo
          onLanguageChange={handleLanguageChange}
        />
      </motion.section>

      <div className="bg-indigo-50 p-4 rounded-lg mb-8">
        <p className="text-sm text-indigo-700">
          Current language: <strong>{language}</strong>
        </p>
        <p className="text-sm text-indigo-700 mt-2">
          The component will search for cities in the selected language, but display results in English for consistency.
        </p>
      </div>

      {/* Saved Locations Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Saved Locations</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Current Location</h3>
              {savedLocations.location ? (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{savedLocations.location.name}</p>
                  <p className="text-sm text-gray-500">
                    {savedLocations.location.country} ({savedLocations.location.countryCode})
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Coordinates: {savedLocations.location.latitude.toFixed(4)}, {savedLocations.location.longitude.toFixed(4)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No saved location</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700">Hometown</h3>
              {savedLocations.from ? (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{savedLocations.from.name}</p>
                  <p className="text-sm text-gray-500">
                    {savedLocations.from.country} ({savedLocations.from.countryCode})
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Coordinates: {savedLocations.from.latitude.toFixed(4)}, {savedLocations.from.longitude.toFixed(4)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No saved hometown</p>
              )}
            </div>

            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recentSearches.slice(0, 6).map((location, index) => (
                    <div
                      key={`${location.id}-${index}`}
                      className="p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                    >
                      <div className="font-medium">{location.name}</div>
                      <div className="text-xs text-gray-500">
                        {[location.region, location.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('recentLocationSearches');
                    setRecentSearches([]);
                  }}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear Recent Searches
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {user ? (
                  <>Your location preferences are saved to both localStorage and your Supabase profile.</>
                ) : (
                  <>Your location preferences are saved to localStorage. Sign in to sync them with your profile.</>
                )}
              </p>

              <button
                onClick={async () => {
                  try {
                    await userPreferences.clearAllPreferences();
                    setSavedLocations({});
                    setRecentSearches([]);
                    localStorage.removeItem('recentLocationSearches');
                    alert('All preferences cleared successfully');
                  } catch (err) {
                    console.error('Error clearing preferences:', err);
                    alert('Error clearing preferences');
                  }
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Clear All Saved Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}