import { DataCell, FogLight } from "../types/Data"
import { GridElement } from "./GridElement"
import { Graphics } from "pixi.js"

class FogMaskElement implements GridElement {
  readonly graphics: Graphics
  private readonly cells: DataCell[][]

  constructor(cells: DataCell[][]) {
    this.graphics = new Graphics()
    this.cells = cells
  }

  clear() {
    this.graphics.clear()
  }

  draw(options: {
    cellSize: number
    currentFogLights: FogLight[] | undefined
  }) {
    if (options.currentFogLights !== undefined) {
      for (let light of options.currentFogLights) {
        let y = light.center[0]
        let x = light.center[1]
        if (light.size === 3) {
          this.graphics.rect(
            (x - 1) * options.cellSize,
            (y - 1) * options.cellSize,
            options.cellSize * 3,
            options.cellSize * 3,
          )
        } else {
          this.graphics.rect(
            x * options.cellSize,
            y * options.cellSize,
            options.cellSize,
            options.cellSize,
          )
        }
      }
    }

    // always show area outside of grid
    this.graphics.rect(
      -5 * options.cellSize,
      -5 * options.cellSize,
      options.cellSize * 5,
      options.cellSize * (this.cells.length + 10),
    )
    this.graphics.rect(
      options.cellSize * this.cells[0].length,
      -5 * options.cellSize,
      options.cellSize * 5,
      options.cellSize * (this.cells.length + 10),
    )
    this.graphics.rect(
      0,
      -5 * options.cellSize,
      options.cellSize * this.cells[0].length,
      options.cellSize * 5,
    )
    this.graphics.rect(
      0,
      options.cellSize * this.cells.length,
      options.cellSize * this.cells[0].length,
      options.cellSize * 5,
    )

    this.graphics.fill(0)
  }
}

export default FogMaskElement
