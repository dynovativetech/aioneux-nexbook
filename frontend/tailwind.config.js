/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ── Brand — Microsoft Blue ─────────────────────────────────────────
      colors: {
        primary: {
          50:  '#e6f3fc',
          100: '#cce7f9',
          200: '#99cff3',
          300: '#66b7ed',
          400: '#339fe7',
          500: '#0087e0',
          600: '#0078D7',   // main brand blue
          700: '#025DB6',   // hover / gradient end
          800: '#0169C9',   // light accent
          900: '#004e9e',
          950: '#003770',
          DEFAULT: '#0078D7',
        },
        secondary: {
          50:  '#f0f4ff',
          100: '#e0e8ff',
          200: '#c7d4fe',
          300: '#a5b8fc',
          400: '#7a96f8',
          500: '#5677f4',
          600: '#3b5bdb',
          700: '#2f4dbf',
          800: '#263f9d',
          900: '#1e3380',
          DEFAULT: '#3b5bdb',
        },
        neutral: {
          0:   '#ffffff',
          50:  '#F5F7FA',
          100: '#f1f5f9',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          DEFAULT: '#059669',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          DEFAULT: '#d97706',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          DEFAULT: '#dc2626',
        },
        surface: {
          page:   '#F5F7FA',
          card:   '#ffffff',
          raised: '#ffffff',
          sunken: '#f1f5f9',
        },
        border: {
          DEFAULT: '#E5E7EB',
          subtle:  '#f1f5f9',
          strong:  '#d1d5db',
          focus:   '#0078D7',
        },
      },

      // ── Typography ────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Shadows — Stripe-level depth ──────────────────────────────────
      boxShadow: {
        'xs':        '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'sm':        '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card':      '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover':'0 8px 24px -4px rgb(0 0 0 / 0.10), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
        'md':        '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg':        '0 10px 20px -3px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.05)',
        'xl':        '0 20px 30px -5px rgb(0 0 0 / 0.09), 0 8px 12px -6px rgb(0 0 0 / 0.05)',
        '2xl':       '0 25px 50px -12px rgb(0 0 0 / 0.18)',
        'inner':     'inset 0 2px 4px 0 rgb(0 0 0 / 0.04)',
        'sidebar':   '4px 0 20px rgb(0 0 0 / 0.05)',
        // Brand colored shadows
        'primary-sm': '0 2px 10px -2px rgb(0 120 215 / 0.40)',
        'primary-md': '0 4px 14px -2px rgb(0 120 215 / 0.35)',
        // Focus rings
        'focus-primary': '0 0 0 3px rgb(0 120 215 / 0.18)',
        'focus-danger':  '0 0 0 3px rgb(220 38 38 / 0.18)',
        'none': 'none',
      },

      // ── Animations ────────────────────────────────────────────────────
      keyframes: {
        'fade-in':    { from: { opacity: '0' },                          to: { opacity: '1' } },
        'fade-out':   { from: { opacity: '1' },                          to: { opacity: '0' } },
        'slide-up':   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-down': { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in':   { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'spin-slow':  { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-in':   'fade-in 0.15s ease-out',
        'fade-out':  'fade-out 0.1s ease-in',
        'slide-up':  'slide-up 0.2s ease-out',
        'slide-down':'slide-down 0.2s ease-out',
        'scale-in':  'scale-in 0.2s ease-out',
        'spin-slow': 'spin-slow 1.5s linear infinite',
      },

      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'spring':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
