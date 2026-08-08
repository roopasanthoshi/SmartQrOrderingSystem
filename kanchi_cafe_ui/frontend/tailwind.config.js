/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#2B1812',
          hover: '#3A241B',
          active: '#4A2E22',
          border: 'rgba(255,255,255,0.06)',
        },
        ink: {
          DEFAULT: '#1F1F1F',
          muted: '#6B7280',
        },
        surface: {
          bg: '#F8F6F2',
          card: '#FFFFFF',
          border: '#ECE7DD',
        },
        cafe: {
          50: '#FDFBF7',
          100: '#F8F6F2', // Background
          200: '#E9E2D7', // Border
          300: '#D5C0A1',
          400: '#B89B6D',
          500: '#8C6F43',
          600: '#6E522E',
          700: '#5A3E2B',
          800: '#3E2A1F', // Dark Coffee
          850: '#4A2E22', // Between 800/900 - used for idle button surfaces
          900: '#3E2A1F', // Dark Coffee
          950: '#180B04',
        },
        gold: {
          100: '#FDF7E7',
          300: '#F3E5AB',
          400: '#DDC073', // Between 300/500 - used for accent text/icons
          500: '#C89B3C', // Primary Gold
          600: '#B5872E', // Hover Gold
          700: '#9B7B27',
          accent: '#D4AF37', // Sidebar accent gold
        },
        cream: {
          50: '#FFFFFF',  // Cards (White)
          100: '#FFFFFF', // Cards (White)
          200: '#F8F6F2', // Background
          300: '#E9E2D7', // Border
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
