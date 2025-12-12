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
        // Spectrum colors - scalable for future perspectives
        forge: {
          bg: "#0a0a0b",
          surface: "#141416",
          border: "#2a2a2e",
          text: "#e4e4e7",
          muted: "#71717a",
        },
        steelman: {
          primary: "#c9a227",
          secondary: "#fef3c7",
          glow: "rgba(201, 162, 39, 0.15)",
        },
        optimist: {
          primary: "#f59e0b",
          secondary: "#fef3c7",
          glow: "rgba(245, 158, 11, 0.15)",
        },
        pragmatist: {
          primary: "#64748b",
          secondary: "#e2e8f0",
          glow: "rgba(100, 116, 139, 0.15)",
        },
        pessimist: {
          primary: "#3b82f6",
          secondary: "#dbeafe",
          glow: "rgba(59, 130, 246, 0.15)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
