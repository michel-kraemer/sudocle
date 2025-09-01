import { Colour } from "../hooks/useGame"
import { ktopl } from "../lib/utils"
import { DataCell } from "../types/Data"
import { SCALE_FACTOR } from "./Grid"
import { DrawOptionField, GridElement } from "./GridElement"
import { Graphics, RenderTexture, Renderer, Sprite } from "pixi.js"

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
  sprite: Sprite
  private readonly graphics: Graphics
  private renderTexture: RenderTexture | undefined
  private readonly cells: DataCell[][]
  private readonly renderer: Renderer

  constructor(cells: DataCell[][], renderer: Renderer) {
    this.sprite = new Sprite()
    this.graphics = new Graphics()
    this.cells = cells
    this.renderer = renderer
  }

  clear() {
    this.graphics.clear()
  }

  set alpha(alpha: number) {
    // this.graphics.alpha makes overlapping half-transparent lines look darker
    // at the intersection points. We therefore render into an offscreen render
    // texture, which we put into a sprite. We can then set the alpha on this
    // sprite to make everything look perfect.
    this.sprite.alpha = alpha
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

    if (type === PenLineType.EdgeRightUp) {
      yy += cellSize
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
    // update offscreen render texture
    let width = this.cells[0].length * options.cellSize
    let height = this.cells.length * options.cellSize
    if (this.renderTexture === undefined) {
      this.renderTexture = RenderTexture.create({
        width,
        height,
        resolution: this.renderer.resolution,
        antialias: true,
      })
    } else {
      this.renderTexture.resize(width, height, this.renderer.resolution)
    }

    // sort lines by color - this avoid strange artifacts when lines of
    // different colors overlap
    let currentPenLines = [...options.currentPenLines]
    currentPenLines.sort((a, b) => a[1].colour - b[1].colour)

    // draw lines
    for (let [k, c] of currentPenLines) {
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

    // render this.graphics into offscreen render texture and update sprite
    this.renderer.render({
      container: this.graphics,
      target: this.renderTexture,
    })
    this.sprite.texture = this.renderTexture
  }
}

export default PenLineElement
