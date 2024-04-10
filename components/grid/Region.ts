import { GridElement } from "./GridElement"
import { ThemeColours } from "./ThemeColours"
import { Graphics } from "pixi.js"

class Region implements GridElement {
  private region: number[]
  readonly graphics: Graphics

  constructor(region: number[]) {
    this.region = region
    this.graphics = new Graphics()
  }

  clear() {
    this.graphics.clear()
  }

  draw(options: { cellSize: number; themeColours: ThemeColours }) {
    this.graphics.poly(this.region.map(v => v * options.cellSize))
    this.graphics.stroke({
      width: 3,
      color: options.themeColours.foregroundColor,
    })
  }
}

export default Region
