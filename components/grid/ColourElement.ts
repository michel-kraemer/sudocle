import { xytok } from "../lib/utils"
import { GridElement } from "./GridElement"
import { Graphics } from "pixi.js"

class ColourElement implements GridElement {
  private readonly x: number
  private readonly y: number
  readonly k: number
  readonly graphics: Graphics

  colour: number

  constructor(x: number, y: number, colour: number) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)

    this.graphics = new Graphics()
    this.graphics.visible = false

    this.colour = colour
  }

  clear() {
    this.graphics.clear()
  }

  set visible(visible: boolean) {
    this.graphics.visible = visible
  }

  draw(options: { cellSize: number }) {
    this.graphics.x = this.x * options.cellSize
    this.graphics.y = this.y * options.cellSize

    this.graphics.rect(0.5, 0.5, options.cellSize - 1, options.cellSize - 1)
    this.graphics.fill(this.colour)

    if (this.colour === 0xffffff) {
      this.graphics.alpha = 1.0
    } else {
      this.graphics.alpha = 0.5
    }
  }
}

export default ColourElement
