import { getAlpha, getRGBColor } from "../lib/colorutils"
import { disposePolygon, shrinkPolygon } from "../lib/polygonutils"
import { GridElement } from "./GridElement"
import { ThemeColours } from "./ThemeColours"
import { Container, Graphics, Text } from "pixi.js"

export interface GridCage {
  outline: number[]
  value?: number | string
  borderColor?: string
  topleft: [number, number]
}

// based on https://codepen.io/unrealnl/pen/aYaxBW by Erik
// published under the MIT license
function drawDashedPolygon(
  points: number[],
  dash: number,
  gap: number,
  graphics: Graphics,
) {
  let dashLeft = 0
  let gapLeft = 0

  for (let i = 0; i < points.length; i += 2) {
    let p1x = points[i]
    let p1y = points[i + 1]
    let p2x = points[(i + 2) % points.length]
    let p2y = points[(i + 3) % points.length]

    let dx = p2x - p1x
    let dy = p2y - p1y

    let len = Math.sqrt(dx * dx + dy * dy)
    let normalx = dx / len
    let normaly = dy / len
    let progressOnLine = 0

    graphics.moveTo(p1x + gapLeft * normalx, p1y + gapLeft * normaly)

    while (progressOnLine <= len) {
      progressOnLine += gapLeft

      if (dashLeft > 0) {
        progressOnLine += dashLeft
      } else {
        progressOnLine += dash
      }

      if (progressOnLine > len) {
        dashLeft = progressOnLine - len
        progressOnLine = len
      } else {
        dashLeft = 0
      }

      graphics.lineTo(
        p1x + progressOnLine * normalx,
        p1y + progressOnLine * normaly,
      )

      progressOnLine += gap

      if (progressOnLine > len && dashLeft === 0) {
        gapLeft = progressOnLine - len
      } else {
        gapLeft = 0
        graphics.moveTo(
          p1x + progressOnLine * normalx,
          p1y + progressOnLine * normaly,
        )
      }
    }
  }
}

class CageElement implements GridElement {
  private readonly cage: GridCage
  private readonly regions: number[][]
  readonly container: Container
  private readonly outline: Graphics
  private readonly topleftBg?: Graphics
  private readonly topleftText?: Text

  constructor(
    cage: GridCage,
    regions: number[][],
    fontFamily: string,
    fontSize: number,
  ) {
    this.cage = cage
    this.regions = regions

    this.container = new Container()

    this.outline = new Graphics()
    this.outline.zIndex = 1
    this.container.addChild(this.outline)

    if (
      this.cage.value !== undefined &&
      this.cage.value !== null &&
      `${this.cage.value}`.trim() !== ""
    ) {
      // create cage label background
      this.topleftBg = new Graphics()
      this.topleftBg.zIndex = 2
      this.container.addChild(this.topleftBg)

      // create cage label text
      // use larger font and scale down afterwards to improve text rendering
      this.topleftText = new Text({
        text: cage.value,
        style: {
          fontFamily,
          fontSize: fontSize * 2,
        },
      })
      this.topleftText.scale.x = 0.5
      this.topleftText.scale.y = 0.5
      this.topleftText.zIndex = 3
      this.container.addChild(this.topleftText)
    }
  }

  clear() {
    this.outline.clear()
    this.topleftBg?.clear()
  }

  draw(options: { cellSize: number; themeColours: ThemeColours }): void {
    // draw outline
    let disposedOutline = disposePolygon(
      this.cage.outline.map(v => v * options.cellSize),
      this.regions.map(rarr => rarr.map(v => v * options.cellSize)),
      1,
    )
    let shrunkenOutline = shrinkPolygon(disposedOutline, 3)
    let color = this.cage.borderColor
      ? getRGBColor(this.cage.borderColor)
      : options.themeColours.foregroundColor
    let alpha = this.cage.borderColor ? getAlpha(this.cage.borderColor) : 1
    drawDashedPolygon(shrunkenOutline, 3, 2, this.outline)
    this.outline.stroke({ width: 1, color, alpha: alpha })

    if (this.topleftText !== undefined) {
      this.topleftText.x =
        this.cage.topleft[1] * options.cellSize + options.cellSize / 20
      this.topleftText.y =
        this.cage.topleft[0] * options.cellSize + options.cellSize / 60 + 0.25

      if (this.topleftBg !== undefined) {
        this.topleftBg.rect(
          0,
          0,
          this.topleftText.width + options.cellSize / 10 - 0.5,
          this.topleftText.height + options.cellSize / 60 + 0.5,
        )
        this.topleftBg.fill(0xffffff)
        this.topleftBg.x = this.cage.topleft[1] * options.cellSize + 0.5
        this.topleftBg.y = this.cage.topleft[0] * options.cellSize + 0.5
      }
    }
  }
}

export default CageElement
