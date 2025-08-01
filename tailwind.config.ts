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
        "zubo-primary-royal-midnight-blue": {
          DEFAULT: "#253347",
          50: "#E8EBEE",
          100: "#D1D7DD",
          200: "#A3B0BF",
          300: "#7589A0",
          400: "#476281",
          500: "#253347", // Default
          600: "#1F2A3B",
          700: "#19222F",
          800: "#131923",
          900: "#0D1117",
          950: "#07080B",
        },
        "zubo-background-porcelain-white": {
          DEFAULT: "#FBF9F6",
          50: "#FFFFFF",
          100: "#FDFCFB",
          200: "#FCFAFA",
          300: "#FBF9F6", // Default
          400: "#F8F6F3",
          500: "#F5F3F0",
          600: "#F2F0ED",
          700: "#EFECE9",
          800: "#ECE9E6",
          900: "#E9E6E3",
          950: "#E6E3E0",
        },
        "zubo-highlight-1-blush-coral": {
          DEFAULT: "#E7A79D",
          50: "#FDF4F3",
          100: "#FBE9E6",
          200: "#F7D4CE",
          300: "#F2BEB5",
          400: "#EDA99D",
          500: "#E7A79D", // Default
          600: "#D0968C",
          700: "#B9857B",
          800: "#A2746A",
          900: "#8B6359",
          950: "#745248",
        },
        "zubo-highlight-2-bronze-clay": {
          DEFAULT: "#B8835C",
          50: "#F8F2ED",
          100: "#F2E5D9",
          200: "#E6CCB3",
          300: "#D9B28D",
          400: "#CC9966",
          500: "#B8835C", // Default
          600: "#A27452",
          700: "#8C6548",
          800: "#75563E",
          900: "#5F4734",
          950: "#48382A",
        },
        "zubo-accent-soft-moss-green": {
          DEFAULT: "#AAB89B",
          50: "#F5F7F3",
          100: "#EBF0E7",
          200: "#D7E0CE",
          300: "#C3D0B5",
          400: "#AFC09C",
          500: "#AAB89B", // Default
          600: "#98A68A",
          700: "#869479",
          800: "#748268",
          900: "#627057",
          950: "#505E46",
        },
        "zubo-text-graphite-gray": {
          DEFAULT: "#2D2D2D",
          50: "#EFEFEF",
          100: "#DFDFDF",
          200: "#BFBFBF",
          300: "#9F9F9F",
          400: "#7F7F7F",
          500: "#5F5F5F",
          600: "#474747",
          700: "#2D2D2D", // Default
          800: "#1F1F1F",
          900: "#101010",
          950: "#080808",
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
