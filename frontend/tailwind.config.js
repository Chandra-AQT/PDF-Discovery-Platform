/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        surface: {
          600: '#2a2a3f',
          700: '#1e1e30',
          800: '#16162a',
          900: '#0f0f1e',
          950: '#09090f',
        },
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed, #6366f1)',
      },
    },
  },
  plugins: [],
}
