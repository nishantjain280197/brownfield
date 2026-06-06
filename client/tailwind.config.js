/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        severity: {
          low: '#22c55e',
          moderate: '#f59e0b',
          high: '#f97316',
          severe: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
