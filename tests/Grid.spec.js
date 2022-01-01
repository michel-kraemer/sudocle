const { test, expect } = require("@playwright/test")
const fs = require("fs")
const path = require("path")

const fixturesDir = path.join(__dirname, "fixtures/grids")
const fixtures = fs.readdirSync(fixturesDir).filter(f => f.endsWith(".json"))

test.describe.parallel("Grid", () => {
  for (let i = 0; i < fixtures.length; ++i) {
    let f = fixtures[i]
    let data = require(path.join(fixturesDir, f))
    test(`${f} (${i}/${fixtures.length})`, async ({ page }) => {
      await page.goto("http://localhost:3000/sudocle/?test=true")
      await page.evaluate(json => window.initTestGrid(json), data)
      const grid = page.locator(".grid")
      await expect(await grid.screenshot()).toMatchSnapshot(`${f}.png`)
    })
  }
})
