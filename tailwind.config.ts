import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '375px',  // Extra small devices (small phones)
      'sm': '640px',  // Small devices (phones)
      'md': '768px',  // Medium devices (tablets)
      'lg': '1024px', // Large devices (laptops)
      'xl': '1280px', // Extra large devices (desktops)
      '2xl': '1536px' // 2X large devices (large desktops)
    },
    extend: {
      colors: {
        // Map both blue and cyan utility scales to the global accent so swapping the accent is centralized
        blue: {
          50: "rgb(var(--accent-rgb) / 0.05)",
          100: "rgb(var(--accent-rgb) / 0.1)",
          200: "rgb(var(--accent-rgb) / 0.2)",
          300: "rgb(var(--accent-rgb) / 0.4)",
          400: "rgb(var(--accent-rgb) / 0.6)",
          500: "rgb(var(--accent-rgb) / 1)",
          600: "rgb(var(--accent-rgb) / 0.9)",
          700: "rgb(var(--accent-rgb) / 0.8)",
          800: "rgb(var(--accent-rgb) / 0.7)",
          900: "rgb(var(--accent-rgb) / 0.6)",
          950: "rgb(var(--accent-rgb) / 0.5)",
          DEFAULT: "rgb(var(--accent-rgb) / 1)",
        },
        cyan: {
          50: "rgb(var(--accent-rgb) / 0.05)",
          100: "rgb(var(--accent-rgb) / 0.1)",
          200: "rgb(var(--accent-rgb) / 0.2)",
          300: "rgb(var(--accent-rgb) / 0.4)",
          400: "rgb(var(--accent-rgb) / 0.6)",
          500: "rgb(var(--accent-rgb) / 1)",
          600: "rgb(var(--accent-rgb) / 0.9)",
          700: "rgb(var(--accent-rgb) / 0.8)",
          800: "rgb(var(--accent-rgb) / 0.7)",
          900: "rgb(var(--accent-rgb) / 0.6)",
          950: "rgb(var(--accent-rgb) / 0.5)",
          DEFAULT: "rgb(var(--accent-rgb) / 1)",
        },
        purple: {
          50: "rgb(var(--accent-rgb) / 0.05)",
          100: "rgb(var(--accent-rgb) / 0.1)",
          200: "rgb(var(--accent-rgb) / 0.2)",
          300: "rgb(var(--accent-rgb) / 0.4)",
          400: "rgb(var(--accent-rgb) / 0.6)",
          500: "rgb(var(--accent-rgb) / 1)",
          600: "rgb(var(--accent-rgb) / 0.9)",
          700: "rgb(var(--accent-rgb) / 0.8)",
          800: "rgb(var(--accent-rgb) / 0.7)",
          900: "rgb(var(--accent-rgb) / 0.6)",
          950: "rgb(var(--accent-rgb) / 0.5)",
          DEFAULT: "rgb(var(--accent-rgb) / 1)",
        },
        sky: {
          50: "rgb(var(--accent-rgb) / 0.05)",
          100: "rgb(var(--accent-rgb) / 0.1)",
          200: "rgb(var(--accent-rgb) / 0.2)",
          300: "rgb(var(--accent-rgb) / 0.4)",
          400: "rgb(var(--accent-rgb) / 0.6)",
          500: "rgb(var(--accent-rgb) / 1)",
          600: "rgb(var(--accent-rgb) / 0.9)",
          700: "rgb(var(--accent-rgb) / 0.8)",
          800: "rgb(var(--accent-rgb) / 0.7)",
          900: "rgb(var(--accent-rgb) / 0.6)",
          950: "rgb(var(--accent-rgb) / 0.5)",
          DEFAULT: "rgb(var(--accent-rgb) / 1)",
        },
        // You can customize specific gold colors here if you want overrides
        gold: {
          100: "#F9F1D8",
          400: "#FACC15", 
          500: "#EAB308",
        }
      },
      keyframes: {
        waveSlide: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        waveSlide: 'waveSlide 12s linear infinite',
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        slideUp: 'slideUp 0.7s ease-out forwards',
        slideInRight: 'slideInRight 0.5s ease-out forwards',
        scaleIn: 'scaleIn 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
export default config;