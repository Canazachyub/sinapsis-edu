import type { Config } from 'tailwindcss';

// Paleta y tipografías de DESIGN.md (sección 1 y 2). No improvisar.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#C2E476',
          mid: '#B4D864',
          dark: '#AACF57',
        },
        jungle: {
          DEFAULT: '#10312D',
          dark: '#0B211F',
          light: '#3D5752',
        },
        cream: '#F3F1E8',
        offwhite: '#FCFCFB',
        purple: {
          DEFAULT: '#795BC2',
          dark: '#473392',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        whatsapp: '#25D366',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'cta-lime': 'linear-gradient(to bottom, #C2E476 0%, #B4D864 59%, #AACF57 100%)',
      },
      boxShadow: {
        card: '0 4px 16px rgba(16, 49, 45, 0.08)',
        'card-hover': '0 16px 40px rgba(16, 49, 45, 0.12)',
        cta: '0 10px 24px rgba(170, 207, 87, 0.45)',
      },
      borderRadius: {
        pill: '999px',
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseLime: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(194,228,118,.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(194,228,118,0)' },
        },
        carousel: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp .5s ease forwards',
        'pulse-lime': 'pulseLime 2s infinite',
        carousel: 'carousel 60s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
