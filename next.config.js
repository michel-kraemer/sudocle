const ESLintPlugin = require("eslint-webpack-plugin")
const optimizedImages = require("next-optimized-images")
const version = require("./package.json").version

const withPlugins = require("next-compose-plugins")

const basePath = process.env.NODE_ENV === "production" ? "/sudocle" : ""
const eslintDirs = ["components", "cypress/plugins", "cypress/support", "pages"]

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

  webpack: (config, { dev, defaultLoaders }) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        defaultLoaders.babel,
        {
          loader: require("styled-jsx/webpack").loader,
          options: {
            type: (fileName, options) => options.query.type || "scoped"
          }
        },
        "sass-loader"
      ]
    })

    if (dev) {
      config.plugins.push(new ESLintPlugin({
        extensions: ["js", "jsx"]
      }))
    }

    return config
  }
}

module.exports = withPlugins([
  [optimizedImages]
], config)
