import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, ArrowLeft, AlertCircle } from 'lucide-react';
import { CityAutocomplete } from '../common/CityAutocomplete';
import { AnimatedButton } from './AnimatedButton';
import type { Location } from '../../types/location';
import { getCurrentLocationWithFallback } from '../../lib/geolocation';
import { logger } from '../../lib/logger';

interface LocationStepProps {
  location: string;
  from: string;
  onUpdate: (data: { location: string; from: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function LocationStep({
  location,
  from,
  onUpdate,
  onNext,
  onBack
}: LocationStepProps) {
  const [currentLocation, setCurrentLocation] = useState(location);
  const [hometown, setHometown] = useState(from);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrentLocation, setSelectedCurrentLocation] = useState<Location | null>(null);
  const [selectedHometown, setSelectedHometown] = useState<Location | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Try to detect user's location on mount if no location is set
  useEffect(() => {
    const detectLocation = async () => {
      if (!currentLocation) {
        setIsDetectingLocation(true);

        try {
          // Use the new geolocation service
          const position = await getCurrentLocationWithFallback();

          if (position) {
            // Use reverse geocoding to get location name
            const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
            if (!apiKey) {
              logger.warn('OpenCage API key not configured, skipping location detection');
              setIsDetectingLocation(false);
              return;
            }

            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${position.latitude}+${position.longitude}&key=${apiKey}&no_annotations=1`,
              {
                method: 'GET',
                headers: {
                  'Accept': 'application/json'
                },
                mode: 'cors'
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const city = result.components.city ||
                  result.components.town ||
                  result.components.village ||
                  result.components.county;

                if (city) {
                  const country = result.components.country;
                  const locationString = `${city}, ${country}`;
                  setCurrentLocation(locationString);

                  // Create location object
                  const locationObj: Location = {
                    id: `detected-${Date.now()}`,
                    name: city,
                    country: country,
                    countryCode: result.components.country_code?.toUpperCase() || '',
                    region: result.components.state || result.components.region || '',
                    latitude: position.latitude,
                    longitude: position.longitude
                  };

                  setSelectedCurrentLocation(locationObj);

                  // Update parent component
                  onUpdate({
                    location: locationString,
                    from: hometown
                  });

                  logger.info('Location detected successfully:', locationString);
                }
              }
            } else {
              logger.warn('OpenCage API error:', response.status, response.statusText);
            }
          } else {
            logger.info('Geolocation not available or permission denied');
          }
        } catch (error) {
          logger.error('Error detecting location:', error);
        } finally {
          setIsDetectingLocation(false);
        }
      }
    };

    detectLocation();
  }, [currentLocation, hometown, onUpdate]);

  const handleContinue = () => {
    setError(null);

    // Validate that both locations are provided
    if (!currentLocation.trim()) {
      setError('Please enter your current location');
      return;
    }

    if (!hometown.trim()) {
      setError('Please enter your hometown');
      return;
    }

    // Update parent component with location data
    onUpdate({
      location: currentLocation,
      from: hometown
    });

    // Proceed to next step
    onNext();
  };

  const handleCurrentLocationSelect = (data: { name: string; location: Location | null }) => {
    setCurrentLocation(data.name);
    setSelectedCurrentLocation(data.location);
    setError(null);
  };

  const handleHometownSelect = (data: { name: string; location: Location | null }) => {
    setHometown(data.name);
    setSelectedHometown(data.location);
    setError(null);
  };

  return (
    <div className="space-y-6">
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

      {/* Location inputs */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <label className="text-sm font-medium text-gray-700">
              Where are you currently located?
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
          <CityAutocomplete
            value={currentLocation}
            onSelect={handleCurrentLocationSelect}
            placeholder={isDetectingLocation ? "Detecting your location..." : "Search your current city..."}
            required
            errorMessage={error && !currentLocation.trim() ? error : undefined}
            storageKey="onboarding"
            fieldName="location"
            disabled={isDetectingLocation}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            <label className="text-sm font-medium text-gray-700">
              Where are you from originally?
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
          <CityAutocomplete
            value={hometown}
            onSelect={handleHometownSelect}
            placeholder="Search your hometown..."
            required
            errorMessage={error && !hometown.trim() ? error : undefined}
            storageKey="onboarding"
            fieldName="from"
            className="w-full"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Why we ask for your location?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Connect with people in your area</li>
                <li>• Find local events and opportunities</li>
                <li>• Get relevant local recommendations</li>
                <li>• Build meaningful relationships nearby</li>
              </ul>
            </div>
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
          disabled={!currentLocation.trim() || !hometown.trim()}
        >
          Continue
        </AnimatedButton>
      </div>
    </div>
  );
}