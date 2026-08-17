/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Ember — a burnt-orange working accent instead of the generic
        // indigo "SaaS blue". Used sparingly against neutral slate.
        brand: {
          50: '#fef6ee',
          100: '#fde9d2',
          200: '#fbcfa0',
          300: '#f8ac60',
          400: '#f4842e',
          500: '#e35f0f',
          600: '#c2470a',
          700: '#9c360b',
          800: '#7e2d0f',
          900: '#68270f',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'ui-sans-serif', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      // Flatten the default scale so nothing reads as an over-rounded
      // "generated dashboard" card. Only sm/md/lg stay as Tailwind ships
      // them (already tight); xl/2xl/3xl get pulled in.
      borderRadius: {
        xl: '0.5rem',
        '2xl': '0.625rem',
        '3xl': '0.75rem',
      },
      // Kill the soft glowing drop-shadows that read as templated —
      // everything gets a tighter, lower-spread shadow instead.
      boxShadow: {
        md: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        lg: '0 2px 8px -2px rgb(0 0 0 / 0.12)',
        xl: '0 4px 14px -2px rgb(0 0 0 / 0.14)',
        '2xl': '0 8px 24px -4px rgb(0 0 0 / 0.18)',
      },
    },
  },
  plugins: [],
}
