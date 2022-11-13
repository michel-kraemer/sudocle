import { test, expect, Page } from "@playwright/test"
import fs from "fs/promises"
import fsSync from "fs"
import { compare } from "odiff-bin"
import path from "path"

const fixturesDir = path.join(__dirname, "fixtures/grids")
const fixtures = fsSync.readdirSync(fixturesDir)
  .filter(f => f.endsWith(".json") && f !== "package.json" && f !== "package-lock.json")

const testResultsDir = path.join(__dirname, "..", "test-results", path.basename(__filename))
const tempScreenshotsDir = path.join(testResultsDir, "temp")
fsSync.mkdirSync(tempScreenshotsDir, { recursive: true })

const expectedScreenshotsDir = path.join(__dirname, `${path.basename(__filename)}-snapshots`)
fsSync.mkdirSync(expectedScreenshotsDir, { recursive: true })

let pages: Page[] = []

// Check if hardware acceleration is enabled. Without it, our tests will be much slower.
test("GPU hardware acceleration", async ({ page }) => {
  await page.goto("chrome://gpu")
  let featureStatusList = page.locator(".feature-status-list")
  await expect(featureStatusList).toContainText("Hardware accelerated")
})

test.describe.parallel("Grid", () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    if (pages[testInfo.workerIndex] === undefined) {
      let page = await browser.newPage()
      pages[testInfo.workerIndex] = page
      await page.goto("http://localhost:3000/sudocle/?test=true")
    }
  })

  for (let i = 0; i < fixtures.length; ++i) {
    let f = fixtures[i]
    let data = require(path.join(fixturesDir, f))
    test(`${f} (${i}/${fixtures.length})`, async ({}, testInfo) => {
      let page = pages[testInfo.workerIndex]

      // load puzzle
      await page.evaluate(json => (window as any).initTestGrid(json), data)

      // take screenshot
      let grid = page.locator(".grid")
      let screenshot = await grid.screenshot()

      // write screenshot to temporary file
      let actualImage = path.join(tempScreenshotsDir, `${f}.png`)
      await fs.writeFile(actualImage, screenshot)

      // check if expected screenshot exists
      let expectedImage = path.join(expectedScreenshotsDir, `${f}.png`)
      if (!fsSync.existsSync(expectedImage)) {
        console.warn(`     Screenshot of ${f} does not exist yet. Creating it now ...`)
        await fs.writeFile(expectedImage, screenshot)
      }

      // compare images
      let diffImage = path.join(testResultsDir, `${f}.diff.png`)
      let result = await compare(expectedImage, actualImage, diffImage, {
        antialiasing: true,
        threshold: 0.2,
        outputDiffMask: true
      })

      // evaluate result
      if (!result.match) {
        // save actual screenshot and expected screenshot next to diff image
        await fs.writeFile(path.join(testResultsDir, `${f}.actual.png`), screenshot)
        await fs.copyFile(expectedImage, path.join(testResultsDir, `${f}.expected.png`))
      }

      // remove temporary screenshot
      fs.unlink(actualImage)

      expect(result.match).toEqual(true)

      // reset Grid for the next test
      await page.evaluate(() => (window as any).resetTestGrid())
    })
  }
})
