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
          DEFAULT: "#253347", // PrimaryRoyal Midnight Blue
          50: "#E8EBF0",
          100: "#D1D7E0",
          200: "#A3B0C0",
          300: "#7589A0",
          400: "#476280",
          500: "#253347", // DEFAULT
          600: "#1F2A3A",
          700: "#19222E",
          800: "#131923",
          900: "#0D1117",
          950: "#07080B",
        },
        "zubo-background": {
          DEFAULT: "#FBF9F6", // Porcelain White
          50: "#FFFFFF",
          100: "#FDFCFB",
          200: "#FBF9F6", // DEFAULT
          300: "#F9F7F2",
          400: "#F7F5EE",
          500: "#F5F3EA",
          600: "#C6C4BC",
          700: "#97958E",
          800: "#696761",
          900: "#3A3934",
          950: "#1C1B19",
        },
        "zubo-highlight-1": {
          DEFAULT: "#E7A79D", // Blush Coral
          50: "#FDF4F2",
          100: "#FBE9E5",
          200: "#F7D4CD",
          300: "#F2BFB5",
          400: "#EDAA9D",
          500: "#E7A79D", // DEFAULT
          600: "#BA867E",
          700: "#8D655F",
          800: "#604440",
          900: "#332221",
          950: "#1A1110",
        },
        "zubo-highlight-2": {
          DEFAULT: "#B8835C", // Bronze Clay
          50: "#F8F2ED",
          100: "#F2E5DB",
          200: "#E6CCB7",
          300: "#D9B293",
          400: "#CC9970",
          500: "#B8835C", // DEFAULT
          600: "#93694A",
          700: "#6E4F37",
          800: "#493525",
          900: "#241B12",
          950: "#120D09",
        },
        "zubo-accent": {
          DEFAULT: "#AAB89B", // Soft Moss Green
          50: "#F5F7F2",
          100: "#EBF0E5",
          200: "#D7E0CD",
          300: "#C3D0B5",
          400: "#AFC19D",
          500: "#AAB89B", // DEFAULT
          600: "#88937C",
          700: "#666E5D",
          800: "#444A3E",
          900: "#22251F",
          950: "#11120F",
        },
        "zubo-text": {
          DEFAULT: "#2D2D2D", // Graphite Gray
          50: "#F0F0F0",
          100: "#E0E0E0",
          200: "#C2C2C2",
          300: "#A3A3A3",
          400: "#858585",
          500: "#666666",
          600: "#474747",
          700: "#2D2D2D", // DEFAULT
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
