/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cafe: {
          50: '#fbf7ee',
          100: '#f5edd7',
          200: '#edd8ad',
          300: '#e3be7e',
          400: '#d9a352',
          500: '#cc8731',
          600: '#b26b25',
          700: '#8e5020',
          800: '#74411f',
          900: '#60371e',
          950: '#361b0d',
        },
      },
    },
  },
  plugins: [],
}
