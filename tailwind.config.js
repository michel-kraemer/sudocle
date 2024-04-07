/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme")

// TODO replace with with the magic <alpha-value> variable once this issue has
// been resolved: https://github.com/tailwindlabs/tailwindcss/issues/9143
// See https://tailwindcss.com/docs/customizing-colors#using-css-variables for
// more information about the <alpha-value> variable.
// Explanation: 'prose' is a plugin and if we use <alpha-value> in our theme
// colors, prose will not be able to replace <alpha-value> with the correct
// tw-opacity variable.
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(--${variableName}) / ${opacityValue})`
    }
    return `rgb(var(--${variableName}))`
  }
}

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "350px",
      sm: "600px",
      md: "800px",
      lg: "1000px",
      xl: "1250px",
      "2xl": "1500px",
    },
    fontFamily: {
      sans: ["var(--font-roboto)", ...defaultTheme.fontFamily.sans],
      condensed: [
        "var(--font-roboto-condensed)",
        "var(--font-roboto)",
        ...defaultTheme.fontFamily.sans,
      ],
      baloo: ["var(--font-baloo)", ...defaultTheme.fontFamily.sans],
    },
    colors: {
      black: withOpacity("black"),
      bg: withOpacity("bg"),
      fg: withOpacity("fg"),
      "grey-500": withOpacity("grey-500"),
      "grey-600": withOpacity("grey-600"),
      "grey-700": withOpacity("grey-700"),
      "fg-500": withOpacity("fg-500"),
      "fg-600": withOpacity("fg-600"),
      "fg-700": withOpacity("fg-700"),
      primary: withOpacity("primary"),
      "primary-highlight": withOpacity("primary-highlight"),
      alert: withOpacity("alert"),
      "modal-success": withOpacity("modal-success"),
      "modal-alert": withOpacity("modal-alert"),
      digit: withOpacity("digit"),
      "digit-small": withOpacity("digit-small"),
      "button-hover": withOpacity("button-hover"),
      "button-active": withOpacity("button-active"),
      "selection-yellow": withOpacity("selection-yellow"),
      "selection-red": withOpacity("selection-red"),
      "selection-green": withOpacity("selection-green"),
      "selection-blue": withOpacity("selection-blue"),
    },
    animation: {
      pulsating: "1s infinite pulsating ease-out alternate",
      "fade-in": "200ms fade-in",
    },
    keyframes: {
      "fade-in": {
        "0%": {
          opacity: "0",
        },
        "100%": {
          opacity: "1",
        },
      },
      pulsating: {
        "0%": {
          "background-color": "rgb(var(--grey-700))",
        },
        "100%": {
          "background-color": "rgb(var(--button-active))",
        },
      },
    },
    borderRadius: {
      DEFAULT: "10px",
      mini: "4px",
    },
  },
  plugins: [],
}
