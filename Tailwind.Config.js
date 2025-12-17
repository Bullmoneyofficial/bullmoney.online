// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}", // Added to ensure it finds files in src/
  ],
  theme: {
    extend: {
      // 1. Define the Keyframes here
      keyframes: {
        fall: {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(150px) rotate(360deg)', opacity: '0' },
        },
        rain: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '0.5' },
          '100%': { transform: 'translateY(200%)', opacity: '0' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0) scale(0.5)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-100px) scale(1.2)', opacity: '0' },
        },
        sparkle: {
          '0%, 100%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      // 2. Define the Animation classes
      animation: {
        fall: 'fall 5s linear infinite',
        rain: 'rain 0.8s linear infinite',
        floatUp: 'floatUp 4s ease-in infinite',
        sparkle: 'sparkle 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}