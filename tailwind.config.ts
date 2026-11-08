import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: "hsl(var(--card))",
        sidebar: "hsl(var(--sidebar))",
        accent: "hsl(var(--accent))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        danger: "hsl(var(--danger))",
      },
      borderRadius: { lg: "0.625rem", md: "0.5rem", sm: "0.375rem" },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
