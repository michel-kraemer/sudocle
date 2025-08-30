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

  set colour(colour: number) {
    this.graphics.strokeStyle.color = colour
  }

  set width(width: number) {
    if (
      width <= 2 &&
      (this.type === PenLineType.CenterRightUp ||
        this.type === PenLineType.EdgeRightUp ||
        this.type === PenLineType.CenterRightDown ||
        this.type === PenLineType.EdgeRightDown)
    ) {
      this.graphics.strokeStyle.width = width * SCALE_FACTOR * 1.1
    } else {
      this.graphics.strokeStyle.width = width * SCALE_FACTOR
    }
  }

  set visible(visible: boolean) {
    this.graphics.visible = visible
  }

  draw(options: { cellSize: number }) {
    this.graphics.moveTo(0, 0)
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
        break
      case PenLineType.CenterRightDown:
      case PenLineType.EdgeRightDown:
        this.graphics.lineTo(options.cellSize, options.cellSize)
        break
    }
    this.graphics.x = (this.rx + this.dx) * options.cellSize
    this.graphics.y = (this.ry + this.dy) * options.cellSize
    this.graphics.stroke({
      width: this.graphics.strokeStyle.width,
      color: this.graphics.strokeStyle.color,
      cap: "round",
      join: "round",
    })
  }
}

export default PenLineElement
