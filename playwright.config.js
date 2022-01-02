const config = {
  use: {
    channel: "chrome",
    deviceScaleFactor: 2,
    launchOptions: {
      // force GPU hardware acceleration (even in headless mode)
      // without hardware acceleration, our tests will be much slower
      args: ["--use-gl=egl"]
    }
  }
}

module.exports = config
