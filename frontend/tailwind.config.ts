import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fdf8f0",
        brand: {
          DEFAULT: "#1d4e89",
          dark: "#163d6e",
          light: "#dbeafe",
        },
        risk: {
          low: "#15803d",
          medium: "#b45309",
          high: "#b91c1c",
        },
      },
      fontSize: {
        senior: ["1.375rem", { lineHeight: "2rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
