const optimizedImages = require("next-optimized-images")
const version = require("./package.json").version

const withPlugins = require("next-compose-plugins")

const basePath = process.env.NODE_ENV === "production" ? "/sudocle" : ""

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
    dirs: ["components", "cypress", "pages"]
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
        }
      ]
    })

    if (dev) {
      config.module.rules.push({
        test: /\.jsx?$/,
        loader: "eslint-loader",
        exclude: [/node_modules/, /\.next/, /out/],
        enforce: "pre",
        options: {
          emitWarning: true
        }
      })
    }

    return config
  }
}

module.exports = withPlugins([
  [optimizedImages]
], config)
