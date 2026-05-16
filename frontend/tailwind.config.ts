import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563EB",
          dark: "#1E40AF",
          light: "#DBEAFE",
          50: "#EFF6FF",
        },
        success: {
          DEFAULT: "#16A34A",
          bg: "#DCFCE7",
          light: "#F0FDF4",
        },
        danger: {
          DEFAULT: "#DC2626",
          bg: "#FEE2E2",
          light: "#FEF2F2",
        },
        warning: {
          DEFAULT: "#D97706",
          bg: "#FEF3C7",
          light: "#FFFBEB",
        },
        neutral: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        peach: "#FED7AA",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        senior: ["1.125rem", { lineHeight: "1.75rem" }],
      },
      borderRadius: {
        card: "20px",
        btn: "16px",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.08)",
        brand: "0 4px 12px rgba(37,99,235,0.18)",
        "brand-lg": "0 8px 24px rgba(37,99,235,0.25)",
        success: "0 4px 12px rgba(22,163,74,0.18)",
        danger: "0 4px 12px rgba(220,38,38,0.18)",
        "record": "0 0 0 0 rgba(220,38,38,0.4)",
      },
      animation: {
        "pulse-ring": "pulseRing 2s ease-in-out infinite",
        "pulse-ring-2": "pulseRing 2s ease-in-out infinite 0.6s",
        "pulse-ring-3": "pulseRing 2s ease-in-out infinite 1.2s",
        "wave-bar": "waveBar 1.2s ease-in-out infinite",
        "fade-up": "fadeUp 0.4s ease-out forwards",
        "scale-in": "scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "slide-up": "slideUp 0.3s ease-out forwards",
        "shimmer": "shimmer 1.8s infinite",
        "shake": "shake 0.5s ease-out",
        "success-pulse": "successPulse 2s ease-in-out 0.4s",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        waveBar: {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.5) rotate(-8deg)" },
          to: { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "15%": { transform: "translateX(-6px)" },
          "30%": { transform: "translateX(6px)" },
          "45%": { transform: "translateX(-4px)" },
          "60%": { transform: "translateX(4px)" },
          "75%": { transform: "translateX(-2px)" },
        },
        successPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(22,163,74,0)" },
          "50%": { boxShadow: "0 0 0 12px rgba(22,163,74,0.12)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
