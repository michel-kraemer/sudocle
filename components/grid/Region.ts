import { FogLight } from "../types/Data"
import { Digit } from "../types/Game"
import { GraphicsEx } from "./GraphicsEx"
import { ThemeColours } from "./ThemeColours"
import { Graphics } from "pixi.js"

class Region implements GraphicsEx {
  private region: number[]
  readonly graphics: Graphics

  constructor(region: number[], zIndex: number) {
    this.region = region
    this.graphics = new Graphics()
    this.graphics.zIndex = zIndex
  }

  draw(options: {
    cellSize: number
    zoomFactor: number
    currentDigits: Map<number, Digit>
    currentFogLights: FogLight[] | undefined
    currentFogRaster: number[][] | undefined
    themeColours: ThemeColours
  }) {
    this.graphics.poly(this.region.map(v => v * options.cellSize))
    this.graphics.stroke({
      width: 3,
      color: options.themeColours.foregroundColor,
    })
  }
}

export default Region
