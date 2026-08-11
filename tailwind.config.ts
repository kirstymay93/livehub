import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "livehub-dark": "#0f0f0f",
        "livehub-card": "#1a1a1a",
        "livehub-border": "#2d2d2d",
        "livehub-hover": "#252525",
        "livehub-accent": "#ff006e",
        "livehub-accent-hover": "#e6005a",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
