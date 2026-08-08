/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#bad3ff',
          300: '#8fb6ff',
          400: '#5f8fff',
          500: '#3968f5',
          600: '#274ad6',
          700: '#1f3aad',
          800: '#1e3389',
          900: '#1c2f6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
