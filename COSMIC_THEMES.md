# 🌌 Dislink Cosmic Theme System

## Overview

The Cosmic Theme System brings your "Simple Cosmic Color Palette Guide" to life with three philosophical color palettes that represent different cosmic moods for building meaningful relationships.

## The Three Cosmic Themes

### 🌟 Nebula Glow - Deep & Dreamy
*"Deep, mysterious, trustworthy"*

- **Primary**: `#0B1E3D` - Deep cosmic navy (like looking into deep space)
- **Secondary**: `#A259FF` - Vibrant nebula violet (magical purple glow)  
- **Accent**: `#FFD37E` - Warm starlight gold (like distant stars)
- **Pop**: `#FF6F61` - Warm coral flare (energy burst)
- **Neutral**: `#F4F5F7` - Soft airy gray (clean background)

### ⚡ Aurora Dream - Vibrant & Inspiring  
*"Bright, inspiring, energetic"*

- **Primary**: `#142850` - Rich indigo night sky (deep but warmer than navy)
- **Secondary**: `#00C1D4` - Bright aurora cyan (like northern lights)
- **Accent**: `#FF9B85` - Soft sunrise coral (warm morning glow)
- **Pop**: `#9D4EDD` - Electric violet beam (lightning energy)
- **Neutral**: `#F9FAFB` - Gentle off-white (softer than pure white)

### 💫 Starlight Horizon - Warm & Philosophical
*"Warm, philosophical, contemplative"*

- **Primary**: `#1A1B41` - Midnight indigo (contemplative depth)
- **Secondary**: `#D4A5FF` - Lavender haze (dreamy purple mist)
- **Accent**: `#FFD6A5` - Warm peach starlight (golden hour warmth)
- **Pop**: `#48CAE4` - Bright star cyan (brilliant discovery moment)
- **Neutral**: `#FAF9F6` - Cosmic dust white (warm, inviting background)

## Implementation

### 🎨 CSS Custom Properties

The system uses CSS custom properties for dynamic theming:

```css
:root {
  --color-cosmic-primary: #0B1E3D;
  --color-cosmic-secondary: #A259FF;
  --color-cosmic-accent: #FFD37E;
  --color-cosmic-pop: #FF6F61;
  --color-cosmic-neutral: #F4F5F7;
}
```

### 🏗️ Tailwind Integration

Access cosmic colors in your Tailwind classes:

```html
<!-- Dynamic colors that change with themes -->
<div class="bg-cosmic-primary text-cosmic-neutral">
<button class="bg-cosmic-secondary hover:bg-cosmic-pop">
<div class="border-cosmic-accent text-cosmic-primary">

<!-- Static theme colors -->
<div class="bg-nebula-primary">
<div class="bg-aurora-secondary">
<div class="bg-starlight-accent">
```

### 🌈 Gradients

Pre-built gradients for each theme:

```html
<div class="cosmic-gradient">           <!-- Current theme main gradient -->
<div class="cosmic-gradient-soft">     <!-- Current theme soft gradient -->
<div class="cosmic-gradient-radial">   <!-- Current theme radial gradient -->

<!-- Or use specific theme gradients -->
<div class="bg-nebula-gradient">
<div class="bg-aurora-gradient">  
<div class="bg-starlight-gradient">
```

### ✨ Special Effects

```html
<div class="cosmic-glow">              <!-- Subtle glow effect -->
<div class="cosmic-glow-lg">           <!-- Large glow effect -->
<div class="cosmic-text-glow">         <!-- Text glow effect -->
<div class="cosmic-border">            <!-- Theme-colored border -->
<div class="cosmic-backdrop">          <!-- Blurred backdrop -->
```

## React Usage

### Theme Management Hook

```tsx
import { useCosmicTheme } from '../lib/cosmicThemes';

function MyComponent() {
  const { 
    currentTheme,           // 'nebula' | 'aurora' | 'starlight'
    currentPalette,         // Full palette object
    changeTheme,            // Function to change theme
    getColorWithOpacity,    // Get theme color with opacity
    allThemes              // All available themes
  } = useCosmicTheme();

  return (
    <div style={{ backgroundColor: currentPalette.colors.primary }}>
      <button onClick={() => changeTheme('aurora')}>
        Switch to Aurora Dream
      </button>
    </div>
  );
}
```

### Theme Selector Components

```tsx
import { 
  CosmicThemeSelector,           // Full theme selector
  CosmicThemeSelectorCompact,    // Compact version for headers
  CosmicThemeSelectorCard        // Card version with descriptions
} from '../components/cosmic/CosmicThemeSelector';

// In your component
<CosmicThemeSelector />
<CosmicThemeSelectorCompact className="ml-4" />
<CosmicThemeSelectorCard />
```

## Color Role Philosophy

Each color has a specific purpose in the cosmic constellation:

- **Primary** = Main brand color (logos, primary buttons, headers)
- **Secondary** = Supporting color (highlights, secondary buttons, links)  
- **Accent** = Warm touches (success states, gentle highlights, badges)
- **Pop** = Energy moments (alerts, call-to-actions, notifications, urgent states)
- **Neutral** = Clean backgrounds and text areas (cards, modals, layouts)

## Theme Persistence

Themes are automatically saved to `localStorage` as `'dislink-cosmic-theme'` and restored on app reload.

## Dynamic Theme Switching

The system supports real-time theme switching with smooth transitions. All cosmic colors automatically update across the entire application when a theme changes.

## Examples

Visit `/demo` to see the cosmic theme system in action with:
- Live theme switching
- Color palette displays  
- Interactive components using cosmic colors
- All three theme variations

## Philosophy

Each theme represents a different cosmic mood for relationship building:

- **Nebula Glow**: For deep, meaningful connections and trust-building
- **Aurora Dream**: For energetic networking and inspiration  
- **Starlight Horizon**: For contemplative, philosophical conversations

The cosmic theme system embodies Dislink's core philosophy: creating a "constellation of relationships" that feels both technological and deeply human. 🌌✨ 