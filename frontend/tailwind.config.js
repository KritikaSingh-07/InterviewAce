/** @type {import('tailwindcss').Config} */

// ─── Brand palette: "Oxblood" ───────────────────────────────────────────────
// Based on the Studio Mayze fashion palette: F5F8F6 · 8A8A83 · 480001 · 030301
// (off-white, stone grey, oxblood, near-black) with a glossy lacquer red and
// silver as supporting tones.
// The codebase historically used indigo / violet / purple classes for its
// brand colour; those scales are remapped here so the whole UI re-themes
// from one place.
//   indigo  → oxblood  — primary brand colour (900 = #480001)
//   violet  → lacquer  — brighter red, gradient partner & dark-mode accent
//   purple  → taupe    — secondary accent
//   gray    → stone    — 50 = #F5F8F6, 500 = #8A8A83, 950 = #030301
const oxblood = {
  50: '#fbf3f3',
  100: '#f6e4e4',
  200: '#edc8c8',
  300: '#dd9d9e',
  400: '#c56466',
  500: '#9b1b1e',
  600: '#7d0b0e',
  700: '#63050a',
  800: '#520204',
  900: '#480001',
  950: '#2a0001',
};

const lacquer = {
  50: '#fdf2f2',
  100: '#fbe2e3',
  200: '#f6c4c6',
  300: '#ee979b',
  400: '#e2616a',
  500: '#c9303a',
  600: '#a81c26',
  700: '#8a141d',
  800: '#6f1118',
  900: '#5a0f15',
  950: '#330608',
};

const taupe = {
  50: '#f7f4f1',
  100: '#ece6e0',
  200: '#d9cec4',
  300: '#bfae9f',
  400: '#a08b79',
  500: '#85705f',
  600: '#6b5849',
  700: '#54453a',
  800: '#3d322b',
  900: '#2a221d',
  950: '#17120f',
};

const stone = {
  50: '#f5f8f6',
  100: '#eceeeb',
  200: '#dcdeda',
  300: '#c2c3bd',
  400: '#a6a69f',
  500: '#8a8a83',
  600: '#6d6d67',
  700: '#51514c',
  800: '#2e2e2b',
  900: '#141412',
  950: '#030301',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: oxblood,
        indigo: oxblood,
        violet: lacquer,
        purple: taupe,
        gray: stone,
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      // Slightly crisper corners for an editorial feel
      borderRadius: {
        xl: '0.625rem',
        '2xl': '0.875rem',
        '3xl': '1.25rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'aurora': 'aurora 18s ease-in-out infinite',
        'aurora-reverse': 'aurora 22s ease-in-out infinite reverse',
        'shimmer': 'shimmer 2.2s linear infinite',
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(201, 48, 58, 0.45)' },
          '100%': { boxShadow: '0 0 20px rgba(201, 48, 58, 0.6), 0 0 40px rgba(72, 0, 1, 0.45)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(6%, -8%) scale(1.15) rotate(20deg)' },
          '66%': { transform: 'translate(-6%, 6%) scale(0.92) rotate(-15deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
