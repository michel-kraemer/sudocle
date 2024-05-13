import { xytok } from "../lib/utils"
import { GridElement } from "./GridElement"
import { Graphics } from "pixi.js"

class SelectionElement implements GridElement {
  private readonly x: number
  private readonly y: number
  readonly k: number
  readonly graphics: Graphics

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)

    this.graphics = new Graphics()
    this.graphics.visible = false
  }

  set visible(visible: boolean) {
    this.graphics.visible = visible
  }

  clear() {
    this.graphics.clear()
  }

  draw(options: { cellSize: number }) {
    this.graphics.rect(0.5, 0.5, options.cellSize - 1, options.cellSize - 1)
    this.graphics.fill({ color: 0xffde2a, alpha: 0.5 })
    this.graphics.x = this.x * options.cellSize
    this.graphics.y = this.y * options.cellSize
  }
}

export default SelectionElement
