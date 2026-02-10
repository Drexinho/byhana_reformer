/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./cenik.html",
    "./lekce.html",
    "./rezervace.html",
    "./src/**/*.{js,ts,html}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        cream: {
          50: '#FFFBF7',
          100: '#FFEDD8',
          200: '#F5E0C8',
          300: '#E8D0B8',
        },
        gold: {
          300: '#F8E4A8',
          400: '#F3D585',
          500: '#E8C96A',
          600: '#D4B85A',
        },
        brown: {
          500: '#C99A6E',
          600: '#BC8A5F',
          700: '#A67B50',
          800: '#7B5A3D',
          900: '#6B4E2E',
        },
      },
    },
  },
  plugins: [],
}
