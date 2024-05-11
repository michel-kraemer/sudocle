import { getAlpha, getRGBColor } from "../lib/colorutils"
import { drawDashedLineString } from "../lib/linestringutils"
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
    if (shrunkenOutline.length > 1) {
      // close polygon
      shrunkenOutline.push(shrunkenOutline[0])
      shrunkenOutline.push(shrunkenOutline[1])
    }
    drawDashedLineString(shrunkenOutline, [3, 2], 0, this.outline)
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
