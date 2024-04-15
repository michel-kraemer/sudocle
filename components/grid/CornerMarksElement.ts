import { hasFog, xytok } from "../lib/utils"
import { GridElement } from "./GridElement"
import { Container, FillStyleInputs, Text, TextStyleFontWeight } from "pixi.js"

class CornerMarksElement implements GridElement {
  private readonly x: number
  private readonly y: number
  private readonly leaveRoom: boolean
  private readonly texts: Text[]
  readonly k: number
  readonly container: Container

  constructor(
    n: number,
    x: number,
    y: number,
    leaveRoom: boolean,
    fontFamily: string,
    fontSize: number,
    fontWeight: TextStyleFontWeight = "normal",
    fill: FillStyleInputs,
  ) {
    this.x = x
    this.y = y
    this.leaveRoom = leaveRoom

    this.k = xytok(x, y)
    this.container = new Container()

    this.texts = []
    for (let i = 0; i < n; ++i) {
      this.texts[i] = new Text({
        style: {
          fontFamily,
          fontSize,
          fontWeight,
          fill,
        },
      })

      this.texts[i].anchor.set(0.5)
      this.texts[i].scale.x = 0.5
      this.texts[i].scale.y = 0.5

      this.container.addChild(this.texts[i])
    }
  }

  setValue(i: number, value: string | number) {
    if (i >= 0 && i < this.texts.length) {
      this.texts[i].text = value
    } else {
      throw new Error(`Corner mark with index ${i} does not exist`)
    }
  }

  setAllVisible(visible: boolean) {
    for (let t of this.texts) {
      t.visible = visible
    }
  }

  setVisible(i: number, visible: boolean) {
    if (i >= 0 && i < this.texts.length) {
      this.texts[i].visible = visible
    } else {
      throw new Error(`Corner mark with index ${i} does not exist`)
    }
  }

  set fontSize(fontSize: number) {
    for (let t of this.texts) {
      t.style.fontSize = fontSize
    }
  }

  set fill(fill: FillStyleInputs) {
    for (let t of this.texts) {
      t.style.fill = fill
    }
  }

  clear() {}

  draw(options: {
    cellSize: number
    currentFogRaster: number[][] | undefined
  }) {
    let cx = this.x * options.cellSize + options.cellSize / 2
    let cy = this.y * options.cellSize + options.cellSize / 2
    let mx = options.cellSize / 3.2
    let my = options.cellSize / 3.4

    let fog = hasFog(options.currentFogRaster, this.x, this.y)

    for (let i = 0; i < this.texts.length; ++i) {
      let text = this.texts[i]
      switch (i) {
        case 0:
          if (this.leaveRoom && !fog) {
            text.x = cx - mx / 3
          } else {
            text.x = cx - mx
          }
          text.y = cy - my
          break
        case 4:
          if (this.leaveRoom && !fog) {
            text.x = cx + mx / 3
          } else {
            text.x = cx
          }
          text.y = cy - my
          break
        case 1:
          text.x = cx + mx
          text.y = cy - my
          break
        case 6:
          text.x = cx - mx
          text.y = cy
          break
        case 7:
          text.x = cx + mx
          text.y = cy
          break
        case 2:
          text.x = cx - mx
          text.y = cy + my
          break
        case 5:
          text.x = cx
          text.y = cy + my
          break
        case 3:
          text.x = cx + mx
          text.y = cy + my
          break
        case 8:
          text.x = cx - mx / 3
          text.y = cy + my
          break
        case 9:
          text.x = cx + mx / 3
          text.y = cy + my
          break
      }
    }
  }
}

export default CornerMarksElement
