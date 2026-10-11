/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f9f7f3",
        "surface-bone": "#f3f0e8",
        "surface-card": "#ffffff",
        "surface-dark": "#202020",
        "surface-deep": "#000000",
        ink: "#202020",
        body: "#3a3a3a",
        charcoal: "#575757",
        mute: "#646464",
        ash: "#8d8d8d",
        stone: "#bbbbbb",
        primary: {
          DEFAULT: "#ea2804",
          deep: "#c01f00",
          glow: "#ff6a3d",
          pink: "#f4a8a0",
        },
        badge: {
          success: "#2b9a66",
        },
        hairline: "rgba(32, 32, 32, 0.12)",
        "hairline-strong": "#202020",
      },
      borderRadius: {
        full: "9999px",
        lg: "16px",
        md: "10px",
        sm: "6px",
        xs: "4px",
      },
      fontFamily: {
        sans: ["Basier Square", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["rb-freigeist-neue", "Bricolage Grotesque", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
