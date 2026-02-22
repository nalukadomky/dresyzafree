import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        overlay: "var(--overlay)",
        /** Sekundární výrazná barva – svítivě zelená */
        accent: {
          DEFAULT: "#86EF42",
          light: "#a3f563",
          dark: "#65d630",
          muted: "rgba(134, 239, 66, 0.5)",
        },
      },
    },
  },
  plugins: [],
};
export default config;

