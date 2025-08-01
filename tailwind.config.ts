import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ZuboPets Brand Colors
        "zubo-primary": {
          50: "#E9ECF0",
          100: "#C8D0D9",
          200: "#A7B4C2",
          300: "#8698AC",
          400: "#657C95",
          500: "#44607F", // PrimaryRoyal Midnight Blue #253347 (closest to 500)
          600: "#3A516C",
          700: "#30435A",
          800: "#253347", // PrimaryRoyal Midnight Blue #253347
          900: "#1B2431",
          950: "#10151B",
        },
        "zubo-background": {
          50: "#FCFAFA",
          100: "#FBF9F6", // Porcelain White #FBF9F6
          200: "#F7F4F0",
          300: "#F2EFEA",
          400: "#EDEAE5",
          500: "#E8E5E0",
          600: "#D3D0CB",
          700: "#BEBBBA",
          800: "#A9A6A4",
          900: "#94918F",
          950: "#807C7A",
        },
        "zubo-highlight-1": {
          50: "#FDF4F3",
          100: "#FBEBE9",
          200: "#F8E2E0",
          300: "#F5D9D6",
          400: "#F2D0CD",
          500: "#EFA79D", // Blush Coral #E7A79D (closest to 500)
          600: "#D9978E",
          700: "#C3877F",
          800: "#AD7770",
          900: "#976761",
          950: "#815752",
        },
        "zubo-highlight-2": {
          50: "#FBF7F3",
          100: "#F7F0E7",
          200: "#F2E9DB",
          300: "#EEDFCF",
          400: "#E9D6C3",
          500: "#B8835C", // Bronze Clay #B8835C (closest to 500)
          600: "#A67753",
          700: "#946B4A",
          800: "#825F41",
          900: "#705338",
          950: "#5E472F",
        },
        "zubo-accent": {
          50: "#F5F8F3",
          100: "#EBF1E7",
          200: "#E0EADF",
          300: "#D6E3D7",
          400: "#CCDCD0",
          500: "#AAB89B", // Soft Moss Green #AAB89B (closest to 500)
          600: "#99A78C",
          700: "#88967D",
          800: "#77856E",
          900: "#66745F",
          950: "#556350",
        },
        "zubo-text": {
          50: "#F0F0F0",
          100: "#E0E0E0",
          200: "#D1D1D1",
          300: "#C2C2C2",
          400: "#B3B3B3",
          500: "#A3A3A3",
          600: "#7A7A7A",
          700: "#525252",
          800: "#2D2D2D", // Graphite Gray #2D2D2D
          900: "#1F1F1F",
          950: "#141414",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
