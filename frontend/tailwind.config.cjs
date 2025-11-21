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
      }
    },
  },
  plugins: [],
};
