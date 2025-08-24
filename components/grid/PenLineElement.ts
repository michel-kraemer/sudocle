import { pltok } from "../lib/utils"
import { SCALE_FACTOR } from "./Grid"
import { GridElement } from "./GridElement"
import { Graphics } from "pixi.js"

export enum PenLineType {
  CenterRight = 0,
  CenterRightUp = 1,
  CenterRightDown = 2,
  CenterDown = 3,
  EdgeRight = 4,
  EdgeRightUp = 5,
  EdgeRightDown = 6,
  EdgeDown = 7,
}

class PenLineElement implements GridElement {
  readonly k: number
  private readonly rx: number
  private readonly ry: number
  private readonly dx: number
  private readonly dy: number
  private readonly type: PenLineType
  readonly graphics: Graphics

  constructor(
    rx: number,
    ry: number,
    dx: number,
    dy: number,
    type: PenLineType,
  ) {
    this.k = pltok(rx, ry, type)
    this.rx = rx
    this.ry = ry
    this.dx = dx
    this.dy = dy
    this.type = type
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
    let width = 2
    switch (this.type) {
      case PenLineType.CenterRight:
      case PenLineType.EdgeRight:
        this.graphics.lineTo(options.cellSize, 0)
        break
      case PenLineType.CenterDown:
      case PenLineType.EdgeDown:
        this.graphics.lineTo(0, options.cellSize)
        break
      case PenLineType.CenterRightUp:
      case PenLineType.EdgeRightUp:
        this.graphics.lineTo(options.cellSize, -options.cellSize)
        width = 2.5
        break
      case PenLineType.CenterRightDown:
      case PenLineType.EdgeRightDown:
        this.graphics.lineTo(options.cellSize, options.cellSize)
        width = 2.5
        break
    }
    this.graphics.x = (this.rx + this.dx) * options.cellSize
    this.graphics.y = (this.ry + this.dy) * options.cellSize
    this.graphics.stroke({
      width: width * SCALE_FACTOR,
      color: 0,
      cap: "round",
      join: "round",
    })
  }
}

export default PenLineElement
