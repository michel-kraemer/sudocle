import { Colour } from "../hooks/useGame"
import { xytok } from "../lib/utils"
import { DrawOptionField, GridElement } from "./GridElement"
import { Graphics } from "pixi.js"

class ColourElement implements GridElement {
  private readonly x: number
  private readonly y: number
  readonly k: number
  readonly graphics: Graphics
  private readonly fixedColour: number | undefined

  constructor(x: number, y: number, fixedColour?: number) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)

    this.graphics = new Graphics()
    this.graphics.visible = false
    this.fixedColour = fixedColour
  }

  clear() {
    this.graphics.clear()
  }

  set visible(visible: boolean) {
    this.graphics.visible = visible
  }

  drawOptionsToMemoize(): DrawOptionField[] {
    if (this.fixedColour !== undefined) {
      return [DrawOptionField.CellSize]
    } else {
      return [
        DrawOptionField.CellSize,
        DrawOptionField.CurrentColours,
        DrawOptionField.PaletteColours,
      ]
    }
  }

  draw(options: {
    cellSize: number
    currentColours: Map<number, Colour>
    paletteColours: number[]
  }) {
    this.graphics.x = this.x * options.cellSize
    this.graphics.y = this.y * options.cellSize

    let palCol: number
    if (this.fixedColour !== undefined) {
      palCol = this.fixedColour
    } else {
      let pc: number | undefined
      let c = options.currentColours.get(this.k)
      if (c !== undefined) {
        pc = options.paletteColours[c.colour - 1]
      }
      if (pc === undefined) {
        pc = options.paletteColours[1] || options.paletteColours[0]
      }
      palCol = pc
    }

    this.graphics.rect(0.5, 0.5, options.cellSize - 1, options.cellSize - 1)
    this.graphics.fill(palCol)

    if (palCol === 0xffffff) {
      this.graphics.alpha = 1.0
    } else {
      this.graphics.alpha = 0.5
    }
  }
}

export default ColourElement
