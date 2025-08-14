import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import { defineConfig } from "eslint/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  {
    extends: compat.extends("next/core-web-vitals"),

    rules: {
      "@next/next/google-font-display": "off",
      "@next/next/no-img-element": "off",

      "comma-spacing": [
        "error",
        {
          before: false,
          after: true,
        },
      ],

      "comma-style": ["error", "last"],
      "eol-last": "error",
      eqeqeq: ["error", "always"],

      "no-multiple-empty-lines": [
        "error",
        {
          max: 1,
        },
      ],

      "no-tabs": "error",
      "no-trailing-spaces": "error",
      "no-var": "error",
      "object-curly-spacing": ["error", "always"],
      quotes: ["error", "double"],
      "react/display-name": "off",
      "react/jsx-curly-spacing": ["error", "never"],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      semi: ["error", "never"],
    },
  },
])
