/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Inter",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Deep navy / ice-blue palette matching the phoenix brand artwork
        primary: {
          50: "#eef5fc",
          100: "#d9e9f8",
          200: "#b3d2f1",
          300: "#82b4e6",
          400: "#5493d6",
          500: "#3676c2",
          600: "#265ba3",
          700: "#1d4681",
          800: "#153360",
          900: "#0d2145",
        },
        navy: {
          950: "#060a18",
          900: "#0a1128",
          800: "#0f1b3d",
          700: "#16264f",
        },
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        apple: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
        "apple-lg": "0 8px 30px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
