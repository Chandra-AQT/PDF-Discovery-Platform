/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent — sky/blue
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Surface — clean whites and light greys with a blue tint
        surface: {
          50:  '#f8fafc',
          100: '#f0f6ff',
          200: '#e2ecf9',
          300: '#ccddf4',
          400: '#94b8e0',
          500: '#60a0d4',
          600: '#3b82c4',
          700: '#2563a8',
        },
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0ea5e9, #6366f1)',
      },
    },
  },
  plugins: [],
}
