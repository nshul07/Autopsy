/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },

      // Semantic tokens. Every one of these is defined as a CSS variable in
      // index.css, so dark mode is a variable swap rather than a second set
      // of class names (see the [data-theme="dark"] block).
      colors: {
        surface: 'var(--surface)',
        canvas: 'var(--canvas)',
        sunken: 'var(--sunken)',
        elevated: 'var(--elevated)',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          soft: 'var(--brand-soft)',
          ink: 'var(--brand-ink)',
        },
        risk: {
          low: {
            DEFAULT: 'var(--risk-low)',
            bg: 'var(--risk-low-bg)',
            border: 'var(--risk-low-border)',
            text: 'var(--risk-low-text)',
          },
          medium: {
            DEFAULT: 'var(--risk-medium)',
            bg: 'var(--risk-medium-bg)',
            border: 'var(--risk-medium-border)',
            text: 'var(--risk-medium-text)',
          },
          high: {
            DEFAULT: 'var(--risk-high)',
            bg: 'var(--risk-high-bg)',
            border: 'var(--risk-high-border)',
            text: 'var(--risk-high-text)',
          },
        },
      },

      spacing: {
        // Minimum comfortable touch target for the older-user audience.
        touch: '48px',
      },

      borderRadius: {
        md: '8px',
        lg: '10px',
        xl: '14px',
      },

      boxShadow: {
        card: 'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
        nav: 'var(--shadow-nav)',
      },

      maxWidth: {
        content: '640px',
        shell: '760px',
      },

      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(14px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },

      animation: {
        'fade-up': 'fade-up 260ms ease-out both',
        'fade-in': 'fade-in 200ms ease-out both',
        'slide-in-right': 'slide-in-right 240ms ease-out both',
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.32, 0.72, 0, 1) both',
      },
    },
  },
  plugins: [],
}