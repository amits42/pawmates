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
          DEFAULT: "#253347", // Royal Midnight Blue
          50: "#EBF0F4",
          100: "#DCE4EB",
          200: "#B4C2D1",
          300: "#8C9FB7",
          400: "#647D9D",
          500: "#3C5B83",
          600: "#2F496A",
          700: "#253A55",
          800: "#1B2B40",
          900: "#111C2B",
          950: "#0B121C",
        },
        "zubo-background": {
          DEFAULT: "#FBF9F6", // Porcelain White
          50: "#FFFFFF",
          100: "#FDFCFB",
          200: "#FBF9F6",
          300: "#F9F7F3",
          400: "#F7F5F0",
          500: "#F5F3ED",
          600: "#C4C2BF",
          700: "#93918E",
          800: "#62605E",
          900: "#31302F",
          950: "#181817",
        },
        "zubo-highlight-1": {
          DEFAULT: "#E7A79D", // Blush Coral
          50: "#FDF4F3",
          100: "#FBEBE8",
          200: "#F7DCD6",
          300: "#F2C9C0",
          400: "#EDBAA9",
          500: "#E7A79D",
          600: "#B9867D",
          700: "#8B645E",
          800: "#5D433E",
          900: "#2F211F",
          950: "#18100F",
        },
        "zubo-highlight-2": {
          DEFAULT: "#B8835C", // Bronze Clay
          50: "#FBF5EF",
          100: "#F7EBE0",
          200: "#F0D7C0",
          300: "#E8C3A0",
          400: "#E0AF80",
          500: "#D89B60",
          600: "#B8835C",
          700: "#8A6245",
          800: "#5C412E",
          900: "#2E2017",
          950: "#17100B",
        },
        "zubo-accent": {
          DEFAULT: "#AAB89B", // Soft Moss Green
          50: "#F5F7F3",
          100: "#F0F3ED",
          200: "#E0E7D9",
          300: "#D0DBC5",
          400: "#C0CFB1",
          500: "#B0C39D",
          600: "#AAB89B",
          700: "#828A74",
          800: "#595C4D",
          900: "#313126",
          950: "#181812",
        },
        "zubo-text-neutral": {
          DEFAULT: "#2D2D2D", // Graphite Gray
          50: "#F0F0F0",
          100: "#E0E0E0",
          200: "#C0C0C0",
          300: "#A0A0A0",
          400: "#808080",
          500: "#606060",
          600: "#484848",
          700: "#383838",
          800: "#2D2D2D",
          900: "#1D1D1D",
          950: "#0F0F0F",
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
