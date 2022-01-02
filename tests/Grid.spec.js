const { test, expect } = require("@playwright/test")
const fs = require("fs")
const path = require("path")

const fixturesDir = path.join(__dirname, "fixtures/grids")
const fixtures = fs.readdirSync(fixturesDir).filter(f => f.endsWith(".json"))

let pages = []

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

      await page.evaluate(json => window.initTestGrid(json), data)

      const grid = page.locator(".grid")
      await expect(await grid.screenshot()).toMatchSnapshot(`${f}.png`)

      await page.evaluate(() => window.resetTestGrid())
    })
  }
})
