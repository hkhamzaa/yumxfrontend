import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:            '#0A0A0A',
          surface:       '#161616',
          'surface-high':'#1A1A1A',
          border:        '#262626',
          accent:        '#F59E0B',
          'accent-h':    '#FFFFFF',
          text:          '#E5E2E1',
          muted:         '#C6C6C7',
          dim:           '#888888',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body:    ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        squoval: '16px',
      },
      keyframes: {
        'loader-dash': {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px #F59E0B)' },
          '50%':      { filter: 'drop-shadow(0 0 18px #F59E0B)' },
        },
      },
      animation: {
        'loader-dash':    'loader-dash 2s ease-in-out forwards',
        'fade-in':        'fade-in 0.6s ease forwards',
        'fade-up':        'fade-up 0.7s ease forwards',
        'slide-in-right': 'slide-in-right 0.6s ease forwards',
        'glow-pulse':     'glow-pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
