import { xytok } from "../lib/utils"
import { DrawOptionField, GridElement } from "./GridElement"
import { FillInput, Text } from "pixi.js"

class CentreMarksElement implements GridElement {
  private x: number
  private y: number
  readonly k: number
  readonly text: Text

  constructor(
    x: number,
    y: number,
    fontFamily: string,
    fontSize: number,
    fill: FillInput,
  ) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)

    this.text = new Text({
      style: {
        fontFamily,
        fontSize,
        fill,
      },
    })
    this.text.anchor.set(0.5)
    this.text.scale.x = 0.5
    this.text.scale.y = 0.5
  }

  set value(value: string | number) {
    this.text.text = value
  }

  set visible(visible: boolean) {
    this.text.visible = visible
  }

  set fontSize(fontSize: number) {
    this.text.style.fontSize = fontSize
  }

  set fill(fill: FillInput) {
    this.text.style.fill = fill
  }

  clear() {}

  drawOptionsToMemoize(): DrawOptionField[] {
    return [DrawOptionField.CellSize]
  }

  draw(options: { cellSize: number }) {
    this.text.x = this.x * options.cellSize + options.cellSize / 2
    this.text.y = this.y * options.cellSize + options.cellSize / 2
  }
}

export default CentreMarksElement
