import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2c3e50',
          foreground: '#ffffff',
        },
        sidebar: {
          DEFAULT: '#2c3e50',
          foreground: '#ffffff',
          muted: '#bdc3c7',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
