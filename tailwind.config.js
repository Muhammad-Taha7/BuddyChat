/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        bg: {
          main: '#f8fafc',
        },
        accent: {
          red: '#fc4a56',
        },
      },
      boxShadow: {
        'outset': '-4px -4px 10px rgba(255, 255, 255, 1), 4px 4px 10px rgba(0, 0, 0, 0.05)',
        'outset-sm': '-2px -2px 5px rgba(255, 255, 255, 1), 2px 2px 5px rgba(0, 0, 0, 0.05)',
        'inset': 'inset -4px -4px 10px rgba(255, 255, 255, 1), inset 4px 4px 10px rgba(0, 0, 0, 0.05)',
        'red-glow': '0 4px 15px rgba(252, 74, 86, 0.4)',
      }
    },
  },
  plugins: [],
}
