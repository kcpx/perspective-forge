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
        // Warm, clean palette
        forge: {
          bg: "#FDFBF7",        // Warm cream background
          surface: "#FFFFFF",   // Clean white cards
          border: "#E8E4DD",    // Soft warm border
          text: "#2D2A26",      // Warm dark text
          muted: "#8C857A",     // Warm muted text
          accent: "#F5F2ED",    // Light accent background
        },
        steelman: {
          primary: "#B8860B",   // Warm gold
          light: "#FDF8E8",     // Light gold tint
        },
        optimist: {
          primary: "#D97706",   // Warm amber
          light: "#FEF6E8",     // Light amber tint
        },
        pragmatist: {
          primary: "#6B7280",   // Neutral gray
          light: "#F3F4F6",     // Light gray tint
        },
        pessimist: {
          primary: "#4B5563",   // Cool gray
          light: "#F1F5F9",     // Light cool tint
        },
        blindspots: {
          primary: "#7C3AED",   // Purple
          light: "#F5F3FF",     // Light purple tint
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
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
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'elevated': '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
