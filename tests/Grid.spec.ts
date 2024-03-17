import { test, expect, Page } from "@playwright/test"
import fs from "fs/promises"
import fsSync from "fs"
import { compare } from "odiff-bin"
import path from "path"
import { EventEmitter } from "events"

const fixturesDir = path.join(__dirname, "fixtures/grids")
const fixtures = fsSync
  .readdirSync(fixturesDir)
  .filter(
    f =>
      f.endsWith(".json") && f !== "package.json" && f !== "package-lock.json"
  )

const testResultsDir = path.join(
  __dirname,
  "..",
  "test-results",
  path.basename(__filename)
)
const tempScreenshotsDir = path.join(testResultsDir, "temp")
fsSync.mkdirSync(tempScreenshotsDir, { recursive: true })

const expectedScreenshotsDir = path.join(
  __dirname,
  `${path.basename(__filename)}-snapshots`
)
fsSync.mkdirSync(expectedScreenshotsDir, { recursive: true })

let pages: Page[] = []
let eventEmitters: EventEmitter[] = []

// Check if hardware acceleration is enabled. Without it, our tests will be much slower.
test("GPU hardware acceleration", async ({ page }) => {
  await page.goto("chrome://gpu")
  let hardwareAccelerated = page
    .locator("li")
    .getByText("* Canvas: Hardware accelerated")
  await expect(hardwareAccelerated).toBeVisible()
})

test.describe.parallel("Grid", () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    if (pages[testInfo.workerIndex] === undefined) {
      let page = await browser.newPage()

      // open page
      pages[testInfo.workerIndex] = page
      await page.goto("http://localhost:3000/sudocle/?test=true")

      // define a global variable to let the page know we're running a test
      await page.evaluate(() => {
        ;(window as any)._SUDOCLE_IS_TEST = true
      })

      // register screenshotRendered function that will receive screenshots
      // and forward them to an event emitter
      eventEmitters[testInfo.workerIndex] = new EventEmitter()
      await page.exposeFunction("screenshotRendered", (url: string) => {
        eventEmitters[testInfo.workerIndex].emit("screenshot", url)
      })
    }
  })

  for (let i = 0; i < fixtures.length; ++i) {
    let f = fixtures[i]
    let data = require(path.join(fixturesDir, f))
    test(`${f} (${i}/${fixtures.length})`, async ({}, testInfo) => {
      let page = pages[testInfo.workerIndex]

      // register promise that will receive screenshot
      let screenshotPromise = new Promise<string>(resolve => {
        eventEmitters[testInfo.workerIndex].once("screenshot", resolve)
      })

      // load puzzle
      let puzzleData = await page.evaluate(
        json => (window as any).initTestGrid(json),
        data
      )
      if (puzzleData.metadata?.bgimage !== undefined) {
        // wait for background image to be loaded
        // TODO check if background image is really rendered
        await page.waitForLoadState("networkidle")
      }

      // wait for screenshot
      let canvasScreenshot = await screenshotPromise
      let canvasDataPart = canvasScreenshot.split(",")[1]
      let screenshot = Buffer.from(canvasDataPart, "base64")

      // write screenshot to temporary file
      let actualImage = path.join(tempScreenshotsDir, `${f}.png`)
      await fs.writeFile(actualImage, screenshot)

      // check if expected screenshot exists
      let expectedImage = path.join(expectedScreenshotsDir, `${f}.png`)
      if (!fsSync.existsSync(expectedImage)) {
        console.warn(
          `     Screenshot of ${f} does not exist yet. Creating it now ...`
        )
        await fs.writeFile(expectedImage, screenshot)
      }

      // compare images
      let diffImage = path.join(testResultsDir, `${f}.odiff.png`)
      let result = await compare(expectedImage, actualImage, diffImage, {
        antialiasing: true,
        threshold: 0.01,
        outputDiffMask: true
      })

      // evaluate result
      let isOK = true
      if (
        !result.match &&
        (result.reason !== "pixel-diff" || result.diffCount > 5)
      ) {
        // save actual screenshot and expected screenshot next to diff image
        await fs.writeFile(
          path.join(testResultsDir, `${f}.actual.png`),
          screenshot
        )
        await fs.copyFile(
          expectedImage,
          path.join(testResultsDir, `${f}.expected.png`)
        )
        isOK = false
      } else if (!result.match) {
        // diffCount (number if different pixels) is below threshold.
        // Diff image is not needed in this case.
        await fs.unlink(diffImage)
      }

      // remove temporary screenshot
      fs.unlink(actualImage)

      expect(isOK).toEqual(true)

      // reset Grid for the next test
      await page.evaluate(() => (window as any).resetTestGrid())
    })
  }
})
