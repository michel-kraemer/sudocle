import { xytok } from "../lib/utils"
import { GridElement } from "./GridElement"
import { Graphics } from "pixi.js"

class ColourElement implements GridElement {
  private readonly x: number
  private readonly y: number
  readonly k: number
  readonly graphics: Graphics

  colour: number
  visible: boolean

  constructor(x: number, y: number, colour: number) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)

    this.graphics = new Graphics()
    this.graphics.alpha = 0

    this.colour = colour
    this.visible = false
  }

  clear() {
    this.graphics.clear()
  }

  draw(options: { cellSize: number }) {
    this.graphics.x = this.x * options.cellSize
    this.graphics.y = this.y * options.cellSize

    this.graphics.rect(0.5, 0.5, options.cellSize - 1, options.cellSize - 1)
    this.graphics.fill(this.colour)

    if (this.visible) {
      if (this.colour === 0xffffff) {
        this.graphics.alpha = 1.0
      } else {
        this.graphics.alpha = 0.5
      }
    } else {
      this.graphics.alpha = 0
    }
  }
}

export default ColourElement
