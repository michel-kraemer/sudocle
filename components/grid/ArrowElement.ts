import { getAlpha, getRGBColor } from "../lib/colorutils"
import { Arrow, Overlay } from "../types/Data"
import BaseLineElement from "./BaseLineElement"
import { SCALE_FACTOR } from "./Grid"
import { Graphics } from "pixi.js"

class ArrowElement extends BaseLineElement<Arrow> {
  private readonly headGraphics: Graphics

  constructor(arrow: Arrow, overlays: Overlay[]) {
    let snappedArrow = BaseLineElement.snapLineToCircle(
      arrow,
      overlays,
      "start",
    )

    super(snappedArrow, snappedArrow === arrow, true)

    this.headGraphics = new Graphics()
    this.container.addChild(this.headGraphics)
  }

  clear() {
    super.clear()
    this.headGraphics.clear()
  }

  draw(options: { cellSize: number; gridOffset: { x: number; y: number } }) {
    // calculate length
    let points = this.getPoints(options.cellSize, options.gridOffset)
    let lastPointX = points[points.length - 2]
    let lastPointY = points[points.length - 1]
    let secondToLastX = points[points.length - 4]
    let secondToLastY = points[points.length - 3]

    let dx = lastPointX - secondToLastX
    let dy = lastPointY - secondToLastY
    let l = Math.sqrt(dx * dx + dy * dy)
    dx /= l
    dy /= l

    if (l > 2) {
      // only draw arrow lines if they are long enough (at least 2 pixels)
      this.drawLineGraphics(points)
    }

    // draw arrow head
    let f: number
    if (l <= 2) {
      // if line is too short (less than 2 pixels), just draw the head
      f = this.baseLine.headLength * options.cellSize * 0.7
    } else {
      // scale head with line length
      f = Math.min(this.baseLine.headLength * options.cellSize * 0.7, l / 3)
    }
    let ex = lastPointX - dx * f
    let ey = lastPointY - dy * f
    let ex1 = ex - dy * f
    let ey1 = ey + dx * f
    let ex2 = ex + dy * f
    let ey2 = ey - dx * f

    this.headGraphics.moveTo(lastPointX, lastPointY)
    this.headGraphics.lineTo(ex1, ey1)
    this.headGraphics.moveTo(lastPointX, lastPointY)
    this.headGraphics.lineTo(ex2, ey2)
    this.headGraphics.stroke({
      alpha: getAlpha(this.baseLine.color),
      width: this.baseLine.thickness * SCALE_FACTOR,
      color: getRGBColor(this.baseLine.color),
      cap: "round",
      join: "round",
    })
  }
}

export default ArrowElement
