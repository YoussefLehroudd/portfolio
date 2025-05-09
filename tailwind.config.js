/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3490dc',
        secondary: '#ffed4a',
        dark: {
          DEFAULT: '#1a202c',
          light: '#2d3748',
        },
        light: {
          DEFAULT: '#f7fafc',
          dark: '#edf2f7',
        }
      },
    },
  },
  plugins: [],
}
