const { addMatchImageSnapshotPlugin } = require("cypress-image-snapshot/plugin")

module.exports = (on, config) => {
  if (config.testingType === "component") {
    require("@cypress/react/plugins/next")(on, config)
  }

  on("before:browser:launch", (browser, launchOptions) => {
    if (browser.name === "chrome" && browser.isHeadless) {
      launchOptions.args.push("--window-size=1000,1000")
      launchOptions.args.push("--force-device-scale-factor=2")
      return launchOptions
    }
  })

  addMatchImageSnapshotPlugin(on, config)

  return config
}
