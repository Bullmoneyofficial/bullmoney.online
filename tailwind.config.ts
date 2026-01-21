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
        // You can customize specific gold colors here if you want overrides
        gold: {
          100: "#F9F1D8",
          400: "#FACC15", 
          500: "#EAB308",
        }
      }
    },
  },
  plugins: [],
};
export default config;