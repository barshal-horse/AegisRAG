import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-background)",
        card: "var(--bg-card)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",
        border: "var(--border-subtle)",
        "border-active": "var(--border-active)",
        accent: "var(--accent-primary)",
        success: "var(--accent-success)",
        danger: "var(--accent-danger)",
        warning: "var(--accent-warning)",
        canvas: "var(--bg-background)",
        surface: "var(--bg-card)",
        "surface-elevated": "var(--bg-elevated)",
        "surface-hover": "var(--bg-hover)",
        // Mapped Aegis tokens for backward compatibility
        aegis: {
          blue: "var(--accent-primary)",
          red: "var(--accent-danger)",
          green: "var(--accent-success)",
          amber: "var(--accent-warning)",
          text: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
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
