/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mandi: {
          50: '#fbf7ee',
          100: '#f5edd6',
          200: '#ebdbad',
          300: '#dec27c',
          400: '#d2a750',
          500: '#bf8d35',
          600: '#a5702b',
          700: '#845325',
          800: '#6c4324',
          900: '#5a3821',
        }
      }
    },
  },
  plugins: [],
}
