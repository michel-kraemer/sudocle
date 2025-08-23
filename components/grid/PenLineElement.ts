import { pltok } from "../lib/utils"
import { SCALE_FACTOR } from "./Grid"
import { GridElement } from "./GridElement"
import { Graphics } from "pixi.js"

export enum PenLineType {
  CenterRight = 0,
  CenterDown = 1,
  EdgeRight = 2,
  EdgeDown = 3,
}

class PenLineElement implements GridElement {
  readonly k: number
  private rx: number
  private ry: number
  private readonly horiz: boolean
  private dx: number
  private dy: number
  readonly graphics: Graphics

  constructor(
    rx: number,
    ry: number,
    horiz: boolean,
    dx: number,
    dy: number,
    type: PenLineType,
  ) {
    this.k = pltok(rx, ry, type)
    this.rx = rx
    this.ry = ry
    this.horiz = horiz
    this.dx = dx
    this.dy = dy
    this.graphics = new Graphics()
    this.graphics.visible = false
  }

  clear() {
    this.graphics.clear()
  }

  set visible(visible: boolean) {
    this.graphics.visible = visible
  }

  draw(options: { cellSize: number }) {
    this.graphics.moveTo(0, 0)
    if (this.horiz) {
      this.graphics.lineTo(options.cellSize, 0)
    } else {
      this.graphics.lineTo(0, options.cellSize)
    }
    this.graphics.x = (this.rx + this.dx) * options.cellSize
    this.graphics.y = (this.ry + this.dy) * options.cellSize
    this.graphics.stroke({
      width: 2 * SCALE_FACTOR,
      color: 0,
      cap: "round",
      join: "round",
    })
  }
}

export default PenLineElement
