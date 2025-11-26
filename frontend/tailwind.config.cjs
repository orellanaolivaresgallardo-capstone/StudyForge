// frontend/tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Usa dark mode automático según el sistema operativo
  darkMode: 'media',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F2E9FF",
          100: "#E6D4FF",
          200: "#C9A9FF",
          300: "#A97DFF",
          400: "#8C51FF",
          500: "#7C3AED",
          600: "#6B26DB",
          700: "#5816BA",
          800: "#441090",
          900: "#300A66",
        }
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out',
        slideOutRight: 'slideOutRight 0.3s ease-in',
        fadeIn: 'fadeIn 0.2s ease-out',
        fadeOut: 'fadeOut 0.2s ease-in',
        scaleIn: 'scaleIn 0.2s ease-out',
        scaleOut: 'scaleOut 0.2s ease-in',
      },
    },
  },
  plugins: [],
};
