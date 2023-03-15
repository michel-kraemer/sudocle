const config = {
  use: {
    channel: "chrome",
    deviceScaleFactor: 2,
    launchOptions: {
      // force GPU hardware acceleration (even in headless mode)
      // without hardware acceleration, our tests will be much slower
      // (see the following link for a list of all `--use-gl` and `--use-angle`
      // flags: https://chromium.googlesource.com/chromium/src/+/master/ui/gl/gl_switches.cc)
      // args: ["--use-gl=egl"]
      // args: ["--use-angle=gles-egl"]
      args: ["--use-gl=angle"]
    }
  }
}

module.exports = config
