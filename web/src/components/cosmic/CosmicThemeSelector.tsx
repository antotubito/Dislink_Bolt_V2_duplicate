import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Sparkles, Zap, Heart } from 'lucide-react';
import { useCosmicTheme, type CosmicTheme, COSMIC_PALETTES } from '../../lib/cosmicThemes';

interface CosmicThemeSelectorProps {
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const themeIcons = {
  nebula: Sparkles,
  aurora: Zap,
  starlight: Heart,
};

export function CosmicThemeSelector({ 
  showLabels = true, 
  orientation = 'horizontal',
  size = 'md',
  className = '' 
}: CosmicThemeSelectorProps) {
  const { currentTheme, allThemes, changeTheme } = useCosmicTheme();
  const [hoveredTheme, setHoveredTheme] = useState<CosmicTheme | null>(null);

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      palette: 'w-8 h-8',
      icon: 'h-3 w-3',
      text: 'text-xs',
    },
    md: {
      container: 'gap-3',
      palette: 'w-12 h-12',
      icon: 'h-4 w-4',
      text: 'text-sm',
    },
    lg: {
      container: 'gap-4',
      palette: 'w-16 h-16',
      icon: 'h-5 w-5',
      text: 'text-base',
    },
  };

  const classes = sizeClasses[size];
  const containerClass = orientation === 'vertical' ? 'flex-col' : 'flex-row items-center';

  return (
    <div className={`cosmic-theme-selector ${className}`}>
      {showLabels && (
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-purple-600" />
          <span className="font-medium text-gray-900">Cosmic Theme</span>
        </div>
      )}

      <div className={`flex ${containerClass} ${classes.container}`}>
        {allThemes.map((theme) => {
          const palette = COSMIC_PALETTES[theme.value];
          const IconComponent = themeIcons[theme.value];
          const isActive = currentTheme === theme.value;
          const isHovered = hoveredTheme === theme.value;

          return (
            <motion.div
              key={theme.value}
              className="relative"
              onMouseEnter={() => setHoveredTheme(theme.value)}
              onMouseLeave={() => setHoveredTheme(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => changeTheme(theme.value)}
                className={`
                  ${classes.palette} rounded-xl relative overflow-hidden
                  transition-all duration-300 cursor-pointer
                  border-2 ${isActive ? 'border-white shadow-lg' : 'border-transparent'}
                  ${isActive ? 'ring-2 ring-cosmic-pop ring-offset-2' : ''}
                `}
                style={{
                  background: palette.gradients.main,
                  boxShadow: isActive || isHovered 
                    ? `0 8px 32px ${palette.colors.secondary}40` 
                    : undefined,
                }}
                title={`${theme.label} - ${theme.description}`}
              >
                {/* Gradient overlay */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{ background: palette.gradients.radial }}
                />
                
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <IconComponent 
                    className={`${classes.icon} text-white drop-shadow-lg`}
                  />
                </div>

                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center"
                    >
                      <Check className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover glow effect */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white bg-opacity-20 rounded-xl"
                    />
                  )}
                </AnimatePresence>
              </button>

              {/* Theme info on hover */}
              <AnimatePresence>
                {isHovered && showLabels && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className={`
                      absolute ${orientation === 'vertical' ? 'left-full ml-4 top-0' : 'top-full mt-2 left-1/2 -translate-x-1/2'}
                      bg-white rounded-lg shadow-xl p-3 z-50 min-w-48
                      border border-gray-200
                    `}
                  >
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {theme.label}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {theme.description}
                      </p>
                      <p className="text-xs text-gray-500 italic">
                        {theme.philosophy}
                      </p>
                      
                      {/* Color preview */}
                      <div className="flex gap-1 mt-3">
                        {Object.entries(palette.colors).map(([key, color]) => (
                          <div
                            key={key}
                            className="w-4 h-4 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                            title={key}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div 
                      className={`
                        absolute w-3 h-3 bg-white border-gray-200
                        ${orientation === 'vertical' 
                          ? 'left-0 top-4 -translate-x-1/2 rotate-45 border-r border-b' 
                          : 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t'
                        }
                      `}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Current theme display */}
      {showLabels && (
        <motion.div 
          key={currentTheme}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 text-center ${classes.text}`}
        >
          <div className="font-medium text-gray-900">
            {COSMIC_PALETTES[currentTheme].name}
          </div>
          <div className="text-purple-600 opacity-80">
            {COSMIC_PALETTES[currentTheme].description}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Compact version for headers/settings
export function CosmicThemeSelectorCompact({ className = '' }: { className?: string }) {
  return (
    <CosmicThemeSelector 
      showLabels={false}
      size="sm"
      orientation="horizontal"
      className={className}
    />
  );
}

// Card version with full descriptions
export function CosmicThemeSelectorCard({ className = '' }: { className?: string }) {
  const { currentTheme, allThemes, changeTheme } = useCosmicTheme();

  return (
    <div className={`cosmic-theme-card bg-gray-50 rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <Palette className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Cosmic Themes</h3>
          <p className="text-sm text-gray-600">Choose your constellation mood</p>
        </div>
      </div>

      <div className="space-y-4">
        {allThemes.map((theme) => {
          const palette = COSMIC_PALETTES[theme.value];
          const IconComponent = themeIcons[theme.value];
          const isActive = currentTheme === theme.value;

          return (
            <motion.button
              key={theme.value}
              onClick={() => changeTheme(theme.value)}
              className={`
                w-full p-4 rounded-xl text-left transition-all duration-300
                border-2 ${isActive ? 'border-purple-600' : 'border-gray-200'}
                ${isActive ? 'bg-purple-600 bg-opacity-10' : 'bg-white hover:bg-gray-50'}
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center relative overflow-hidden"
                  style={{ background: palette.gradients.main }}
                >
                  <IconComponent className="h-5 w-5 text-white drop-shadow-lg" />
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-gray-900" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">
                    {theme.label}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {theme.description}
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    {theme.philosophy}
                  </div>
                </div>

                {/* Color swatch */}
                <div className="flex flex-col gap-1">
                  {Object.entries(palette.colors).slice(0, 3).map(([key, color]) => (
                    <div
                      key={key}
                      className="w-3 h-3 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
} 