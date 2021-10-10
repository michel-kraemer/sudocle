import GameContext from "./contexts/GameContext"
import SettingsContext from "./contexts/SettingsContext"
import Grid from "./Grid"
import { TYPE_INIT } from "./lib/Actions"
import { convertFPuzzle } from "./lib/fpuzzlesconverter"
import { mount } from "@cypress/react"
import { useContext, useEffect } from "react"
import { enableAllPlugins } from "immer"
import { chunk } from "lodash"
import styles from "../pages/_app.scss?type=global"

enableAllPlugins()

const gridFixtures = require.context("../cypress/fixtures/grids", false, /\.json$/)
  .keys()
  .map(fn => fn.replace(/^\.\//, ""))

const GridContainer = ({ data, maxWidth, maxHeight }) => {
  const game = useContext(GameContext.State)
  const updateGame = useContext(GameContext.Dispatch)

  useEffect(() => {
    updateGame({
      type: TYPE_INIT,
      data
    })
  }, [updateGame, data])

  return <>{game.data && (<div style={{
    display: "flex",
    width: "100vw",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center"
  }}>
    <Grid maxWidth={maxWidth} maxHeight={maxHeight} />
  </div>)}</>
}

describe("Grid", () => {
  let width = 750
  let height = 750

  let parallelTotal = +(Cypress.env("parallelTotal") || 1)
  let parallelCurrent = +(Cypress.env("parallelCurrent") || 0)
  let parallelChunkSize = Math.ceil(gridFixtures.length / parallelTotal)

  let fixtureChunk = chunk(gridFixtures, parallelChunkSize)[parallelCurrent]
  for (let fi = 0; fi < fixtureChunk.length; ++fi) {
    let fixture = fixtureChunk[fi]
    let start = parallelChunkSize * parallelCurrent
    it(`${fixture} (${fi}/${fixtureChunk.length}; ${start}-${start + fixtureChunk.length}/${gridFixtures.length})`, () => {
      cy.viewport(width, height)

      cy.fixture(`grids/${fixture}`).then(data => {
        if (data.fpuzzles) {
          data = convertFPuzzle(data.fpuzzles)
        }

        mount(<>
          <GameContext.Provider>
            <SettingsContext.Provider>
              <GridContainer data={data} maxWidth={width} maxHeight={height} />
            </SettingsContext.Provider>
          </GameContext.Provider>
          <style jsx>{styles}</style>
        </>)

        cy.matchImageSnapshot(`Grid - ${fixture}`)
      })
    })
  }
})
