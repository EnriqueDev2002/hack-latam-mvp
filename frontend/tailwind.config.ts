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
          low: "#059669",
          medium: "#d97706",
          high: "#dc2626",
        },
      },
      fontSize: {
        senior: ["1.25rem", { lineHeight: "1.75rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
