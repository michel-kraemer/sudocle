import { xytok } from "../lib/utils"
import { GridElement } from "./GridElement"
import { FillStyleInputs, Text } from "pixi.js"

class DigitElement implements GridElement {
  private readonly x: number
  private readonly y: number
  readonly k: number
  readonly text: Text

  constructor(x: number, y: number, fontFamily: string, fontSize: number) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)

    this.text = new Text({
      style: {
        fontFamily,
        fontSize,
      },
    })
    this.text.anchor.set(0.5)
  }

  set visible(visible: boolean) {
    this.text.visible = visible
  }

  get visible(): boolean {
    return this.text.visible
  }

  set value(value: string | number) {
    this.text.text = value
  }

  set fill(fill: FillStyleInputs) {
    this.text.style.fill = fill
  }

  set fontSize(fontSize: number) {
    this.text.style.fontSize = fontSize
  }

  clear() {}

  draw(options: { cellSize: number }) {
    this.text.x = this.x * options.cellSize + options.cellSize / 2
    this.text.y = this.y * options.cellSize + options.cellSize / 2
  }
}

export default DigitElement
