import type { Config } from 'tailwindcss';

// Tokens de DESIGN.md v3 ("Clínico y confiable").
// Los alias legacy (jungle.DEFAULT/dark/light, lime.DEFAULT, cream, offwhite, purple)
// se mantienen mientras se migran las páginas internas.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        jungle: {
          DEFAULT: '#10312D',
          900: '#0B211F',
          800: '#10312D',
          700: '#174540',
          600: '#1F5B52',
          100: '#E3EEEC',
          50: '#F1F7F5',
          dark: '#0B211F',
          light: '#51625E',
        },
        lime: {
          DEFAULT: '#C2E476',
          300: '#D6EE9F',
          400: '#C2E476',
          500: '#AACF57',
          mid: '#B4D864',
          dark: '#AACF57',
        },
        paper: '#F6F8F7',
        line: '#E2E8E6',
        ink: '#0F1A18',
        muted: '#51625E',
        subtle: '#8A9A96',
        correct: '#16A34A',
        wrong: '#DC2626',
        cream: '#F6F8F7',
        offwhite: '#FFFFFF',
        purple: { DEFAULT: '#1F5B52', dark: '#10312D' },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#2563EB',
        whatsapp: '#25D366',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 26, 24, 0.04), 0 1px 3px rgba(15, 26, 24, 0.04)',
        'card-hover': '0 12px 32px -8px rgba(15, 26, 24, 0.14)',
        mock: '0 30px 60px -20px rgba(15, 26, 24, 0.35), 0 0 0 1px rgba(15, 26, 24, 0.04)',
        'mock-dark': '0 40px 80px -24px rgba(0, 0, 0, 0.6)',
        cta: '0 8px 24px -6px rgba(194, 228, 118, 0.55)',
      },
      borderRadius: {
        pill: '999px',
      },
      maxWidth: {
        site: '1200px',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.8) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.15) rotate(20deg)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        progress: {
          '0%': { width: '18%' },
          '100%': { width: '62%' },
        },
      },
      animation: {
        twinkle: 'twinkle 2.4s ease-in-out infinite',
        'float-y': 'floatY 6s ease-in-out infinite',
        progress: 'progress 14s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
