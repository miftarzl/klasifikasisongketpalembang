module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Songket Palembang Palette
        songket: {
          gold: '#C8A23A',
          'dark-gold': '#A67C00',
          cream: '#F8F5EE',
          ivory: '#FFFDF8',
          maroon: '#7A1F1F',
          emerald: '#1E5631',
          'text-primary': '#2E2116',
          'text-secondary': '#5C4B3B',
          border: '#D8C7A3',
          hover: '#E6C56B',
          success: '#2E7D32',
          warning: '#D4A017',
          error: '#B3261E',
        },
        // Legacy colors
        primary: '#C8A23A',
        primarySoft: '#E6C56B',
        secondary: '#A67C00',
        accent: '#7A1F1F',
        surface: '#FFFDF8',
        surfaceSoft: '#F8F5EE',
        textDark: '#2E2116',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(46, 33, 22, 0.08)',
        panel: '0 4px 16px rgba(46, 33, 22, 0.12)',
        elegant: '0 8px 24px rgba(46, 33, 22, 0.15)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'soft-glow': 'radial-gradient(circle at top left, rgba(200, 162, 58, 0.1), transparent 34%), radial-gradient(circle at bottom right, rgba(166, 124, 0, 0.08), transparent 28%)',
        'songket-pattern': 'linear-gradient(45deg, rgba(200, 162, 58, 0.05) 25%, transparent 25%, transparent 75%, rgba(200, 162, 58, 0.05) 75%, rgba(200, 162, 58, 0.05))',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(200, 162, 58, 0.3)' },
          '50%': { boxShadow: '0 0 15px rgba(200, 162, 58, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
