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
    extend: {},
  },
  plugins: [],
};
