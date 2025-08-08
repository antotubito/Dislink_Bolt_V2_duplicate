/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter var',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      spacing: {
        '11': '2.75rem', // 44px minimum touch target
        '18': '4.5rem',  // 72px
        '22': '5.5rem',  // 88px
        '30': '7.5rem',  // 120px
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      screens: {
        xs: '475px',
        '3xl': '1920px',
      },
      colors: {
        // Neutral Base: Light, airy grays and warm off-whites for readability
        gray: {
          50: '#FAFBFC',   // Cosmic white - softest starlight
          100: '#F4F6F8',  // Nebula mist
          200: '#E8ECEF',  // Distant cloud
          300: '#D3D9DD',  // Silver stardust
          400: '#9BA3A9',  // Asteroid gray
          500: '#6B7480',  // Deep space gray
          600: '#4A5258',  // Dark matter
          700: '#343A40',  // Event horizon
          800: '#212529',  // Black hole edge
          900: '#0D1117',  // Deep space void
        },
        
        // Primary Color: Deep, rich cosmic blue/indigo symbolizing trust, depth, and the infinite
        cosmic: {
          50: '#F0F4FF',   // Ethereal blue mist
          100: '#E0EAFF',  // Dawn sky
          200: '#C7D9FF',  // Twilight glow
          300: '#A3C1FF',  // Celestial blue
          400: '#7BA3FF',  // Stellar blue
          500: '#4F7CFF',  // Deep cosmic blue - PRIMARY
          600: '#3B5CDB',  // Galactic blue
          700: '#2A4BB7',  // Deep nebula
          800: '#1E3A8A',  // Dark cosmic
          900: '#172B5C',  // Infinite depths
        },
        
        // Secondary Colors: Starlight and galaxy tones for warmth and dreaminess
        starlight: {
          50: '#FFFDF7',   // Pure starlight
          100: '#FFF9E6',  // Gentle glow
          200: '#FFF0C2',  // Warm starbeam
          300: '#FFE194',  // Golden star
          400: '#FFCD56',  // Bright stella
          500: '#FFB020',  // Luminous gold - SECONDARY
          600: '#E69500',  // Solar flare
          700: '#CC7A00',  // Amber star
          800: '#A65F00',  // Deep gold
          900: '#8A4600',  // Ancient gold
        },
        
        nebula: {
          50: '#FDF7FF',   // Soft nebula mist
          100: '#F8EDFF',  // Lavender cloud
          200: '#EDD8FF',  // Purple haze
          300: '#DFBBFF',  // Violet dream
          400: '#CB94FF',  // Cosmic purple
          500: '#B366FF',  // Mystical nebula - SECONDARY
          600: '#9333EA',  // Deep purple
          700: '#7C2D9B',  // Dark mystical
          800: '#5B1F6B',  // Shadow nebula
          900: '#3F1447',  // Deep mystery
        },
        
        aurora: {
          50: '#F0FDFF',   // Aurora shimmer
          100: '#E0F9FF',  // Ice crystal
          200: '#BFF0FF',  // Glacial blue
          300: '#8EE5FF',  // Cyan glow
          400: '#4DD4FF',  // Bright aurora
          500: '#00BFFF',  // Electric aurora - SECONDARY
          600: '#0099CC',  // Deep teal
          700: '#007299',  // Ocean depths
          800: '#004C66',  // Abyssal blue
          900: '#002633',  // Deep current
        },
        
        // Accent Pop: Vivid highlights for energy, connection, and discovery
        electric: {
          50: '#F0FFFF',   // Electric shimmer
          100: '#E0FFFE',  // Cyan mist
          200: '#B8FFFD',  // Bright glow
          300: '#7DFFFA',  // Electric burst
          400: '#39FFF4',  // Neon cyan
          500: '#00FFE6',  // Electric cyan - ACCENT POP
          600: '#00D9C7',  // Vivid teal
          700: '#00B3A6',  // Bright turquoise
          800: '#008C84',  // Deep electric
          900: '#005C5A',  // Dark energy
        },
        
        magenta: {
          50: '#FFF0FF',   // Soft magenta glow
          100: '#FFE0FF',  // Pink nebula
          200: '#FFB8FF',  // Bright pink
          300: '#FF7DFF',  // Vivid magenta
          400: '#FF39FF',  // Electric pink
          500: '#FF00FF',  // Pure magenta - ACCENT POP
          600: '#D900D9',  // Deep magenta
          700: '#B300B3',  // Rich magenta
          800: '#8C008C',  // Dark pink
          900: '#5C005C',  // Deep rose
        },
        
        // Additional cosmic colors for special elements
        comet: {
          50: '#F8FBFF',   // Comet trail
          100: '#EDF5FF',  // Ice crystal
          200: '#D6E8FF',  // Frost blue
          300: '#B1D4FF',  // Cool blue
          400: '#7AB8FF',  // Bright comet
          500: '#3B9BFF',  // Comet blue
          600: '#1E7CDB',  // Deep comet
          700: '#1560B7',  // Comet core
          800: '#0F4A8A',  // Dark comet
          900: '#0A355C',  // Comet shadow
        },
        
        galaxy: {
          50: '#FEFCFF',   // Galaxy dust
          100: '#FCF7FF',  // Milky mist
          200: '#F7EBFF',  // Soft galaxy
          300: '#EEDAFF',  // Galaxy glow
          400: '#DFC2FF',  // Spiral arm
          500: '#CBA6FF',  // Galaxy center
          600: '#A855F7',  // Deep galaxy
          700: '#8B5CF6',  // Rich galaxy
          800: '#7C3AED',  // Dark galaxy
          900: '#5B21B6',  // Galaxy core
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-out': 'fade-out 0.5s ease-in',
        'slide-in': 'slide-in 0.5s ease-out',
        'slide-out': 'slide-out 0.5s ease-in',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
        'cosmic-glow': 'cosmic-glow 4s ease-in-out infinite alternate',
        'stellar-drift': 'stellar-drift 15s ease-in-out infinite',
        'nebula-shift': 'nebula-shift 8s ease-in-out infinite alternate',
        'aurora-wave': 'aurora-wave 6s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-out': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(50px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(50px) rotate(-360deg)' },
        },
        'cosmic-glow': {
          '0%': { 
            boxShadow: '0 0 20px rgba(79, 124, 255, 0.3), 0 0 40px rgba(79, 124, 255, 0.1)',
            transform: 'scale(1)',
          },
          '100%': { 
            boxShadow: '0 0 30px rgba(79, 124, 255, 0.5), 0 0 60px rgba(79, 124, 255, 0.2)',
            transform: 'scale(1.02)',
          },
        },
        'stellar-drift': {
          '0%, 100%': { transform: 'translateX(0px) translateY(0px)' },
          '25%': { transform: 'translateX(10px) translateY(-5px)' },
          '50%': { transform: 'translateX(-5px) translateY(-10px)' },
          '75%': { transform: 'translateX(-10px) translateY(5px)' },
        },
        'nebula-shift': {
          '0%': { 
            background: 'linear-gradient(45deg, rgba(179, 102, 255, 0.1), rgba(79, 124, 255, 0.1))',
          },
          '100%': { 
            background: 'linear-gradient(45deg, rgba(79, 124, 255, 0.1), rgba(179, 102, 255, 0.1))',
          },
        },
        'aurora-wave': {
          '0%, 100%': { 
            background: 'linear-gradient(90deg, rgba(0, 191, 255, 0.1), rgba(255, 0, 255, 0.1), rgba(0, 255, 230, 0.1))',
          },
          '33%': { 
            background: 'linear-gradient(90deg, rgba(255, 0, 255, 0.1), rgba(0, 255, 230, 0.1), rgba(0, 191, 255, 0.1))',
          },
          '66%': { 
            background: 'linear-gradient(90deg, rgba(0, 255, 230, 0.1), rgba(0, 191, 255, 0.1), rgba(255, 0, 255, 0.1))',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addUtilities }) {
      const newUtilities = {
        '.safe-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};