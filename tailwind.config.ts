import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
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