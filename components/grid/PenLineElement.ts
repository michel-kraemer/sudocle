import { Colour } from "../hooks/useGame"
import { ktopl } from "../lib/utils"
import { SCALE_FACTOR } from "./Grid"
import { DrawOptionField, GridElement } from "./GridElement"
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
  readonly graphics: Graphics

  constructor() {
    this.graphics = new Graphics()
  }

  clear() {
    this.graphics.clear()
  }

  set alpha(alpha: number) {
    this.graphics.alpha = alpha
  }

  set visible(visible: boolean) {
    this.graphics.visible = visible
  }

  private drawLine(x: number, y: number, type: PenLineType, cellSize: number) {
    let xx = x * cellSize
    let yy = y * cellSize

    if (
      type === PenLineType.CenterRight ||
      type === PenLineType.CenterDown ||
      type === PenLineType.CenterRightUp ||
      type === PenLineType.CenterRightDown
    ) {
      xx += cellSize / 2
      yy += cellSize / 2
    }

    this.graphics.moveTo(xx, yy)
    switch (type) {
      case PenLineType.CenterRight:
      case PenLineType.EdgeRight:
        this.graphics.lineTo(xx + cellSize, yy)
        break
      case PenLineType.CenterDown:
      case PenLineType.EdgeDown:
        this.graphics.lineTo(xx, yy + cellSize)
        break
      case PenLineType.CenterRightUp:
      case PenLineType.EdgeRightUp:
        this.graphics.lineTo(xx + cellSize, yy - cellSize)
        break
      case PenLineType.CenterRightDown:
      case PenLineType.EdgeRightDown:
        this.graphics.lineTo(xx + cellSize, yy + cellSize)
        break
    }
  }

  drawOptionsToMemoize(): DrawOptionField[] {
    return [
      DrawOptionField.CellSize,
      DrawOptionField.CurrentPenLines,
      DrawOptionField.PalettePenColours,
      DrawOptionField.PenWidth,
    ]
  }

  draw(options: {
    cellSize: number
    currentPenLines: Map<number, Colour>
    palettePenColours: number[]
    penWidth: number
  }) {
    for (let [k, c] of options.currentPenLines) {
      let [x, y, t] = ktopl(k)

      let color =
        options.palettePenColours[c.colour - 1] ??
        options.palettePenColours[1] ??
        options.palettePenColours[0]

      let width: number
      if (
        options.penWidth <= 2 &&
        (t === PenLineType.CenterRightUp ||
          t === PenLineType.EdgeRightUp ||
          t === PenLineType.CenterRightDown ||
          t === PenLineType.EdgeRightDown)
      ) {
        width = options.penWidth * SCALE_FACTOR * 1.1
      } else {
        width = options.penWidth * SCALE_FACTOR
      }

      this.drawLine(x, y, t, options.cellSize)

      this.graphics.stroke({
        width,
        color,
        cap: "round",
        join: "round",
      })
    }
  }
}

export default PenLineElement
