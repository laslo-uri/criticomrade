/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        border: 'var(--color-border)',
        accent: '#8F1818',
        'accent-hover': '#A81F1F',
        'accent-light': '#C42828',
        secondary: '#FFB347',
        'secondary-deep': '#E89B35',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
