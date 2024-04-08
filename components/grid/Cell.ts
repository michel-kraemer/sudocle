import {
  Dispatch as GameContextDispatch,
  State as GameContextState,
} from "../contexts/GameContext"
import {
  ACTION_PUSH,
  ACTION_REMOVE,
  ACTION_SET,
  SelectionAction,
  TYPE_SELECTION,
} from "../lib/Actions"
import { MODE_PEN } from "../lib/Modes"
import { xytok } from "../lib/utils"
import { FogLight } from "../types/Data"
import { Digit } from "../types/Game"
import { GraphicsEx } from "./GraphicsEx"
import { ThemeColours } from "./ThemeColours"
import { FederatedPointerEvent, Graphics, Rectangle } from "pixi.js"

class Cell implements GraphicsEx {
  private x: number
  private y: number
  k: number
  graphics: Graphics

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)

    this.graphics = new Graphics()
    this.graphics.eventMode = "static"
    this.graphics.cursor = "pointer"
  }

  draw(options: {
    cellSize: number
    zoomFactor: number
    currentDigits: Map<number, Digit>
    currentFogLights: FogLight[] | undefined
    currentFogRaster: number[][] | undefined
    themeColours: ThemeColours
  }) {
    this.graphics.rect(0, 0, options.cellSize, options.cellSize)
    this.graphics.stroke({
      width: 1,
      color: options.themeColours.foregroundColor,
    })

    this.graphics.x = this.x * options.cellSize
    this.graphics.y = this.y * options.cellSize

    // since our cells have a transparent background, we need to
    // define a hit area
    this.graphics.hitArea = new Rectangle(
      0,
      0,
      options.cellSize,
      options.cellSize,
    )
  }
}

export default Cell
