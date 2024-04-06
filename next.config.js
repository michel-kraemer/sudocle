const ESLintPlugin = require("eslint-webpack-plugin")
const svgToMiniDataURI = require("mini-svg-data-uri")
const version = require("./package.json").version

const basePath =
  process.env.SUDOCLE_BASE_PATH === undefined
    ? process.env.NODE_ENV === "production"
      ? "/sudocle"
      : ""
    : process.env.SUDOCLE_BASE_PATH

const corsAllowOrigin = process.env.SUDOCLE_CORS_ALLOW_ORIGIN ?? "*"

const eslintDirs = ["app", "components", "cypress/plugins", "cypress/support"]

const config = {
  basePath,

  // create a folder for each page
  trailingSlash: true,

  env: {
    basePath,
    matomoUrl: process.env.MATOMO_URL,
    matomoSiteId: process.env.MATOMO_SITE_ID,
    version
  },

  eslint: {
    dirs: eslintDirs
  },

  images: {
    // disable built-in image support
    disableStaticImages: true
  },

  async headers() {
    return [
      {
        source: "/puzzles/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: corsAllowOrigin
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type"
          }
        ]
      }
    ]
  },

  webpack: (config, { dev, defaultLoaders }) => {
    config.module.rules.push({
      test: /\.(gif|png|jpe?g)$/i,
      type: "asset",
      use: "image-webpack-loader"
    })

    config.module.rules.push({
      test: /\.svg$/i,
      type: "asset",
      use: "image-webpack-loader",
      generator: {
        dataUrl: content => {
          content = content.toString()
          return svgToMiniDataURI(content)
        }
      }
    })

    if (dev) {
      config.plugins.push(
        new ESLintPlugin({
          extensions: ["js", "jsx"]
        })
      )
    }

    return config
  }
}

module.exports = config
