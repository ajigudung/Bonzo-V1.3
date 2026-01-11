/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#8B5CF6',
        'dark-bg': '#0b1020',
        'dark-card': '#111827',
        'dark-border': '#1f2937',
      },
    },
  },
  plugins: [],
};
