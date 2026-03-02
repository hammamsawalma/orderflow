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
        background: "var(--background)",
        foreground: "var(--foreground)",
        institutional: {
          navy: "#091A3A",
          dark: "#050f24",
          cyan: "#00FFFF",
          magenta: "#FF00FF",
          yellow: "#FFFF00",
        },
      },
    },
  },
  plugins: [],
};
export default config;
