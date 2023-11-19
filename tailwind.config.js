/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme")

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    screens: {
      xs: "350px",
      sm: "600px",
      md: "800px",
      lg: "1000px",
      xl: "1250px",
      "2xl": "1500px"
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-roboto)", ...defaultTheme.fontFamily.sans],
        condensed: [
          "var(--font-roboto-condensed)",
          "var(--font-roboto)",
          ...defaultTheme.fontFamily.sans
        ],
        baloo: ["var(--font-baloo)", ...defaultTheme.fontFamily.sans]
      }
    }
  },
  plugins: []
}
