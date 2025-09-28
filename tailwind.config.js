/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Space Grotesk',
          'Inter',
          'system-ui',
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
        // Captamundi-inspired color palette
        captamundi: {
          primary: '#a855f7',      // Purple-500
          'primary-dark': '#9333ea', // Purple-600
          secondary: '#6366f1',    // Indigo-500
          'secondary-dark': '#4f46e5', // Indigo-600
          accent: '#ec4899',       // Pink-500
          'accent-dark': '#db2777', // Pink-600
        },
        
        // Dynamic theme colors using CSS custom properties
        cosmic: {
          primary: 'var(--color-cosmic-primary)',
          secondary: 'var(--color-cosmic-secondary)',
          accent: 'var(--color-cosmic-accent)',
          pop: 'var(--color-cosmic-pop)',
          neutral: 'var(--color-cosmic-neutral)',
        },
        
        // Static color palettes for direct access
        nebula: {
          primary: '#0B1E3D',    // Deep cosmic navy
          secondary: '#A259FF',   // Vibrant nebula violet
          accent: '#FFD37E',      // Warm starlight gold
          pop: '#FF6F61',         // Warm coral flare
          neutral: '#F4F5F7',     // Soft airy gray
        },
        aurora: {
          primary: '#142850',     // Rich indigo night sky
          secondary: '#00C1D4',   // Bright aurora cyan
          accent: '#FF9B85',      // Soft sunrise coral
          pop: '#9D4EDD',         // Electric violet beam
          neutral: '#F9FAFB',     // Gentle off-white
        },
        starlight: {
          primary: '#1A1B41',     // Midnight indigo
          secondary: '#D4A5FF',   // Lavender haze
          accent: '#FFD6A5',      // Warm peach starlight
          pop: '#48CAE4',         // Bright star cyan
          neutral: '#FAF9F6',     // Cosmic dust white
        },
        
        // Keep essential grays for UI consistency
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        
        // Legacy indigo support (will gradually replace with cosmic themes)
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-out': 'fade-out 0.5s ease-in',
        'slide-in': 'slide-in 0.5s ease-out',
        'slide-out': 'slide-out 0.5s ease-in',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'cosmic-glow': 'cosmic-glow 3s ease-in-out infinite alternate',
        'stellar-twinkle': 'stellar-twinkle 2s ease-in-out infinite',
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
        'cosmic-glow': {
          '0%': { boxShadow: '0 0 20px rgba(162, 89, 255, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(162, 89, 255, 0.6)' },
        },
        'stellar-twinkle': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, var(--color-cosmic-primary) 0%, var(--color-cosmic-secondary) 100%)',
        'nebula-gradient': 'linear-gradient(135deg, #0B1E3D 0%, #A259FF 100%)',
        'aurora-gradient': 'linear-gradient(135deg, #142850 0%, #00C1D4 100%)',
        'starlight-gradient': 'linear-gradient(135deg, #1A1B41 0%, #D4A5FF 100%)',
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
        '.cosmic-text-glow': {
          textShadow: '0 0 10px var(--color-cosmic-secondary)',
        },
        '.stellar-blur': {
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.1)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};