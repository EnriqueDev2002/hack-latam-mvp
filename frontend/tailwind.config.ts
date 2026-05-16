import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          low: "#10b981",
          medium: "#f59e0b",
          high: "#ef4444",
        },
      },
      fontSize: {
        senior: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
