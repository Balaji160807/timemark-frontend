import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B2430",
        paper: "#EDF1EE",
        surface: "#FFFFFF",
        ochre: "#C9932A",
        "ochre-dark": "#9C711D",
        forest: "#3F7D5C",
        "forest-bg": "#E4EFE8",
        brick: "#B84A3E",
        "brick-bg": "#F6E7E5",
        amber: "#B8862E",
        "amber-bg": "#F6EDDA",
        slate: "#5B6472",
        "slate-light": "#8A93A0",
        border: "#D7DBD8",
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
