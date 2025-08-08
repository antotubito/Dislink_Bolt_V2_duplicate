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
        // 🌌 Cosmic Color Palette - Nebula Glow
        cosmic: {
          50: '#F8FAFF',   // Lightest cosmic mist
          100: '#F1F5FF',  // Soft cosmic glow
          200: '#E3EBFF',  // Gentle cosmic light
          300: '#C7D6FE',  // Cosmic atmosphere
          400: '#A5B8FC',  // Cosmic medium
          500: '#8B9CF8',  // Cosmic bright
          600: '#6B7EF2',  // Cosmic strong
          700: '#4F5DE8',  // Cosmic deep
          800: '#3B47D9',  // Cosmic darker
          900: '#0B1E3D',  // Deep cosmic navy (PRIMARY)
        },
        nebula: {
          50: '#FDF4FF',   // Softest nebula
          100: '#FAE8FF',  // Light nebula mist
          200: '#F5D0FE',  // Gentle nebula
          300: '#E6B3FF',  // Nebula medium
          400: '#D699FF',  // Nebula bright
          500: '#C680FF',  // Nebula strong
          600: '#B566FF',  // Nebula deep
          700: '#A259FF',  // Vibrant nebula violet (SECONDARY 1)
          800: '#8A47E6',  // Nebula darker
          900: '#7235CC',  // Deepest nebula
        },
        stardust: {
          50: '#FFFBF0',   // Softest starlight
          100: '#FFF7E0',  // Light starlight
          200: '#FFEFC2',  // Gentle starlight
          300: '#FFE7A3',  // Starlight medium
          400: '#FFDF85',  // Starlight bright
          500: '#FFD766',  // Starlight strong
          600: '#FFCF47',  // Starlight deep
          700: '#FFD37E',  // Warm starlight gold (SECONDARY 2)
          800: '#E6BE71',  // Starlight darker
          900: '#CCA964',  // Deepest starlight
        },
        constellation: {
          50: '#FFF5F5',   // Softest constellation
          100: '#FFEBEB',  // Light constellation
          200: '#FFD6D6',  // Gentle constellation
          300: '#FFC2C2',  // Constellation medium
          400: '#FFADAD',  // Constellation bright
          500: '#FF9999',  // Constellation strong
          600: '#FF8585',  // Constellation deep
          700: '#FF6F61',  // Warm coral flare (ACCENT POP)
          800: '#E6645A',  // Constellation darker
          900: '#CC5952',  // Deepest constellation
        },
        // 🌟 Enhanced Neutrals
        gray: {
          50: '#F4F5F7',   // Soft airy gray (NEUTRAL LIGHT)
          100: '#F9FAFB',  // Gentle off-white
          200: '#FAF9F6',  // Cosmic dust white
          300: '#E5E7EB',  // Standard gray
          400: '#D1D5DB',  // Medium gray
          500: '#9CA3AF',  // Text gray
          600: '#6B7280',  // Dark text gray
          700: '#4B5563',  // Darker gray
          800: '#374151',  // Very dark gray
          900: '#1F2937',  // Darkest gray
        },
        // Keep existing indigo for backward compatibility
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
        // ✨ Cosmic Animations
        'constellation-twinkle': 'constellation-twinkle 3s ease-in-out infinite',
        'cosmic-float': 'cosmic-float 8s ease-in-out infinite',
        'starlight-pulse': 'starlight-pulse 2s ease-in-out infinite',
        'nebula-drift': 'nebula-drift 20s linear infinite',
        'aurora-dance': 'aurora-dance 15s ease-in-out infinite',
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
        // ✨ Cosmic Animation Keyframes
        'constellation-twinkle': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        'cosmic-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'starlight-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'nebula-drift': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.05)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'aurora-dance': {
          '0%': { transform: 'translateX(0) translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateX(30px) translateY(-20px) rotate(120deg)' },
          '66%': { transform: 'translateX(-20px) translateY(15px) rotate(240deg)' },
          '100%': { transform: 'translateX(0) translateY(0) rotate(360deg)' },
        },
      },
      // 🎨 Gradient Utilities
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #0B1E3D 0%, #A259FF 50%, #FFD37E 100%)',
        'nebula-gradient': 'linear-gradient(135deg, #A259FF 0%, #FF6F61 100%)',
        'stardust-gradient': 'linear-gradient(135deg, #FFD37E 0%, #FFCF47 100%)',
        'constellation-field': 'radial-gradient(ellipse at top, #0B1E3D 0%, #1A1B41 50%, #000000 100%)',
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
        // 🌌 Cosmic Text Utilities
        '.text-cosmic-gradient': {
          background: 'linear-gradient(135deg, #0B1E3D 0%, #A259FF 50%, #FFD37E 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-nebula-gradient': {
          background: 'linear-gradient(135deg, #A259FF 0%, #FF6F61 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-stardust-gradient': {
          background: 'linear-gradient(135deg, #FFD37E 0%, #FFCF47 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};