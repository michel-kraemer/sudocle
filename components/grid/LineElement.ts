import { Line, Overlay } from "../types/Data"
import BaseLineElement from "./BaseLineElement"

class LineElement extends BaseLineElement<Line> {
  constructor(
    line: Line,
    allLines: Line[],
    overlays: Overlay[],
    tryShortenLine: boolean = true,
  ) {
    let { shortenStart, shortenEnd } = tryShortenLine
      ? BaseLineElement.needsLineShortening(line, allLines)
      : { shortenStart: false, shortenEnd: false }
    let startSnappedLine = BaseLineElement.snapLineToCircle(
      line,
      overlays,
      "start",
    )
    if (startSnappedLine !== line) {
      shortenStart = false
    }
    let endSnappedLine = BaseLineElement.snapLineToCircle(
      startSnappedLine,
      overlays,
      "end",
    )
    if (endSnappedLine !== startSnappedLine) {
      shortenEnd = false
    }

    super(endSnappedLine, shortenStart, shortenEnd)
  }

  draw(options: {
    cellSize: number
    unitSize: number
    gridOffset: { x: number; y: number }
  }): void {
    super.draw(options)

    if (this.baseLine.backgroundColor !== undefined) {
      this.lineGraphics.fill(this.baseLine.backgroundColor)
    }
  }
}

export default LineElement
