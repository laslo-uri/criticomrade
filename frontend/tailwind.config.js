/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        elevated: token('elevated'),
        border: token('border'),
        text: token('text'),
        muted: token('muted'),
        accent: token('accent'),
        'accent-strong': token('accent-strong'),
        'accent-ink': token('accent-ink'),
        brass: token('brass'),
        'brass-ink': token('brass-ink'),
        ink: token('ink'),
        paper: token('paper'),
        success: token('success'),
        danger: token('danger'),
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Big Shoulders Display"', '"Arial Narrow"', 'Impact', 'sans-serif'],
      },
      borderRadius: {
        poster: '6px',
        panel: '14px',
      },
      boxShadow: {
        poster: '0 1px 0 rgb(255 255 255 / 0.04) inset, 0 10px 30px -12px rgb(0 0 0 / 0.55)',
        lift: '0 18px 40px -18px rgb(0 0 0 / 0.6)',
      },
      maxWidth: {
        page: '76rem',
      },
      keyframes: {
        'rays-in': {
          from: { opacity: '0', transform: 'rotate(-14deg) scale(0.92)' },
          to: { opacity: '1', transform: 'rotate(0deg) scale(1)' },
        },
        'band-in': {
          from: { transform: 'translateX(-6%) skewY(-6deg)', opacity: '0' },
          to: { transform: 'translateX(0) skewY(-6deg)', opacity: '1' },
        },
        'stamp-in': {
          '0%': { opacity: '0', transform: 'translateY(14px) rotate(var(--tilt, 0deg)) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(var(--tilt, 0deg)) scale(1)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'rays-in': 'rays-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) both',
        'band-in': 'band-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
        'stamp-in': 'stamp-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-up': 'fade-up 0.32s ease both',
      },
    },
  },
  plugins: [],
};
