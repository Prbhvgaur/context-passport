import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './popup.html', './options.html'],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        electric: '#3B82F6',
        emerald: '#10B981',
        slate: {
          850: '#172033',
        },
      },
      boxShadow: {
        panel: '0 18px 48px rgba(15, 23, 42, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      transitionTimingFunction: {
        'soft-out': 'ease',
      },
    },
  },
  darkMode: ['class'],
  plugins: [],
};

export default config;

