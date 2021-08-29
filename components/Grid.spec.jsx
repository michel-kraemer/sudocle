import GameContext from "./contexts/GameContext"
import SettingsContext from "./contexts/SettingsContext"
import Grid from "./Grid"
import { TYPE_INIT } from "./lib/Actions"
import { mount } from "@cypress/react"
import { useContext, useEffect } from "react"
import { enableAllPlugins } from "immer"
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

  for (let fixture of gridFixtures) {
    it(fixture, () => {
      cy.viewport(width, height)

      cy.fixture(`grids/${fixture}`).then(data => {
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
