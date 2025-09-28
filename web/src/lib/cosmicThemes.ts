// 🌌 Dislink Cosmic Theme System
// Constellation of relationships - philosophical, cosmic, and human-centered

import React from 'react';

export type CosmicTheme = 'nebula' | 'aurora' | 'starlight';

export interface CosmicPalette {
  name: string;
  description: string;
  philosophy: string;
  colors: {
    primary: string;    // Main brand color (logos, primary buttons)
    secondary: string;  // Supporting color (highlights, secondary buttons)
    accent: string;     // Warm touches (success states, gentle highlights)
    pop: string;        // Energy moments (alerts, call-to-actions, notifications)
    neutral: string;    // Clean backgrounds and text areas
  };
  gradients: {
    main: string;
    soft: string;
    radial: string;
  };
}

export const COSMIC_PALETTES: Record<CosmicTheme, CosmicPalette> = {
  nebula: {
    name: 'Nebula Glow',
    description: 'Deep & Dreamy',
    philosophy: 'Deep, mysterious, trustworthy',
    colors: {
      primary: '#0B1E3D',    // Deep cosmic navy - like looking into deep space
      secondary: '#A259FF',   // Vibrant nebula violet - magical purple glow
      accent: '#FFD37E',      // Warm starlight gold - like distant stars
      pop: '#FF6F61',         // Warm coral flare - energy burst
      neutral: '#F4F5F7',     // Soft airy gray - clean background
    },
    gradients: {
      main: 'linear-gradient(135deg, #0B1E3D 0%, #A259FF 100%)',
      soft: 'linear-gradient(135deg, #0B1E3D 0%, #A259FF 50%, #FFD37E 100%)',
      radial: 'radial-gradient(circle at center, #A259FF 0%, #0B1E3D 70%)',
    },
  },
  aurora: {
    name: 'Aurora Dream',
    description: 'Vibrant & Inspiring',
    philosophy: 'Bright, inspiring, energetic',
    colors: {
      primary: '#142850',     // Rich indigo night sky - deep but warmer than navy
      secondary: '#00C1D4',   // Bright aurora cyan - like northern lights
      accent: '#FF9B85',      // Soft sunrise coral - warm morning glow
      pop: '#9D4EDD',         // Electric violet beam - lightning energy
      neutral: '#F9FAFB',     // Gentle off-white - softer than pure white
    },
    gradients: {
      main: 'linear-gradient(135deg, #142850 0%, #00C1D4 100%)',
      soft: 'linear-gradient(135deg, #142850 0%, #00C1D4 50%, #FF9B85 100%)',
      radial: 'radial-gradient(circle at center, #00C1D4 0%, #142850 70%)',
    },
  },
  starlight: {
    name: 'Starlight Horizon',
    description: 'Warm & Philosophical',
    philosophy: 'Warm, philosophical, contemplative',
    colors: {
      primary: '#1A1B41',     // Midnight indigo - contemplative depth
      secondary: '#D4A5FF',   // Lavender haze - dreamy purple mist
      accent: '#FFD6A5',      // Warm peach starlight - golden hour warmth
      pop: '#48CAE4',         // Bright star cyan - brilliant discovery moment
      neutral: '#FAF9F6',     // Cosmic dust white - warm, inviting background
    },
    gradients: {
      main: 'linear-gradient(135deg, #1A1B41 0%, #D4A5FF 100%)',
      soft: 'linear-gradient(135deg, #1A1B41 0%, #D4A5FF 50%, #FFD6A5 100%)',
      radial: 'radial-gradient(circle at center, #D4A5FF 0%, #1A1B41 70%)',
    },
  },
};

// Default theme
const DEFAULT_THEME: CosmicTheme = 'nebula';

// Theme management
export class CosmicThemeManager {
  private currentTheme: CosmicTheme = DEFAULT_THEME;
  private listeners: Array<(theme: CosmicTheme) => void> = [];

  constructor() {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('dislink-cosmic-theme') as CosmicTheme;
    if (savedTheme && Object.keys(COSMIC_PALETTES).includes(savedTheme)) {
      this.currentTheme = savedTheme;
    }

    // Apply initial theme
    this.applyTheme(this.currentTheme);
  }

  getCurrentTheme(): CosmicTheme {
    return this.currentTheme;
  }

  getCurrentPalette(): CosmicPalette {
    return COSMIC_PALETTES[this.currentTheme];
  }

  setTheme(theme: CosmicTheme): void {
    if (!Object.keys(COSMIC_PALETTES).includes(theme)) {
      console.warn(`Unknown cosmic theme: ${theme}`);
      return;
    }

    this.currentTheme = theme;

    // Save to localStorage
    localStorage.setItem('dislink-cosmic-theme', theme);

    // Apply CSS custom properties
    this.applyTheme(theme);

    // Notify listeners
    this.listeners.forEach(listener => listener(theme));
  }

  private applyTheme(theme: CosmicTheme): void {
    const palette = COSMIC_PALETTES[theme];
    const root = document.documentElement;

    // Set CSS custom properties for dynamic theming
    root.style.setProperty('--color-cosmic-primary', palette.colors.primary);
    root.style.setProperty('--color-cosmic-secondary', palette.colors.secondary);
    root.style.setProperty('--color-cosmic-accent', palette.colors.accent);
    root.style.setProperty('--color-cosmic-pop', palette.colors.pop);
    root.style.setProperty('--color-cosmic-neutral', palette.colors.neutral);

    // Set gradient properties
    root.style.setProperty('--gradient-cosmic-main', palette.gradients.main);
    root.style.setProperty('--gradient-cosmic-soft', palette.gradients.soft);
    root.style.setProperty('--gradient-cosmic-radial', palette.gradients.radial);

    // Add data attribute to body for CSS targeting
    document.body.setAttribute('data-cosmic-theme', theme);

    console.log(`🌌 Applied cosmic theme: ${palette.name} - ${palette.description}`);
  }

  subscribe(listener: (theme: CosmicTheme) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get color with opacity
  getColorWithOpacity(colorKey: keyof CosmicPalette['colors'], opacity: number): string {
    const color = this.getCurrentPalette().colors[colorKey];

    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Get all themes for theme selector
  getAllThemes(): Array<{ value: CosmicTheme; label: string; description: string; philosophy: string }> {
    return Object.entries(COSMIC_PALETTES).map(([key, palette]) => ({
      value: key as CosmicTheme,
      label: palette.name,
      description: palette.description,
      philosophy: palette.philosophy,
    }));
  }
}

// Create singleton instance
export const cosmicThemeManager = new CosmicThemeManager();

// React hook for theme management
export function useCosmicTheme() {
  const [currentTheme, setCurrentTheme] = React.useState<CosmicTheme>(
    cosmicThemeManager.getCurrentTheme()
  );

  React.useEffect(() => {
    const unsubscribe = cosmicThemeManager.subscribe(setCurrentTheme);
    return unsubscribe;
  }, []);

  const changeTheme = React.useCallback((theme: CosmicTheme) => {
    cosmicThemeManager.setTheme(theme);
  }, []);

  const getCurrentPalette = React.useCallback(() => {
    return cosmicThemeManager.getCurrentPalette();
  }, [currentTheme]);

  const getColorWithOpacity = React.useCallback((
    colorKey: keyof CosmicPalette['colors'],
    opacity: number
  ) => {
    return cosmicThemeManager.getColorWithOpacity(colorKey, opacity);
  }, [currentTheme]);

  return {
    currentTheme,
    currentPalette: getCurrentPalette(),
    changeTheme,
    getColorWithOpacity,
    allThemes: cosmicThemeManager.getAllThemes(),
  };
}

// Utility functions for getting theme colors in CSS
export function getCosmicColor(colorKey: keyof CosmicPalette['colors']): string {
  return `var(--color-cosmic-${colorKey})`;
}

export function getCosmicGradient(gradientKey: 'main' | 'soft' | 'radial'): string {
  return `var(--gradient-cosmic-${gradientKey})`;
}

// Add missing React import
import React from 'react'; 