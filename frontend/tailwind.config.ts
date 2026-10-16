import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#07090D",
        surface: "#0E131A",
        "surface-elevated": "#161F2A",
        "surface-hover": "#1C2735",
        border: "#1D2633",
        "border-active": "#2B95D6",
        aegis: {
          blue: "#2B95D6",
          red: "#DB3737",
          green: "#0F9960",
          amber: "#D9822B",
          text: "#F5F8FA",
          secondary: "#A7B6C2",
          muted: "#73808C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
