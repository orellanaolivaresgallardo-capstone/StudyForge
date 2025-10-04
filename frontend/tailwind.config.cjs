/** @type {import('tailwindcss').Config} */
module.exports = {
  // Usa dark mode automático según el SO. (Si prefieres forzarlo con clase, cambia a 'class')
  darkMode: 'media',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // por si luego agregas JS/TS
  ],
  theme: {
    extend: {
      // Aquí puedes extender colores, tipografías, etc.
    },
  },
  plugins: [],
};
