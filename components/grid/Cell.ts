import { useGame } from "../hooks/useGame"
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
  readonly k: number
  readonly graphics: Graphics

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)

    this.graphics = new Graphics()
    this.graphics.eventMode = "static"
    this.graphics.cursor = "pointer"

    this.graphics.on("pointerdown", e => {
      this.selectCell(this.k, e)
      e.stopPropagation()
      e.originalEvent.preventDefault()
    })

    this.graphics.on("pointerover", e => {
      if (e.buttons === 1) {
        this.selectCell(this.k, e, true)
      }
      e.stopPropagation()
    })
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

  selectCell(
    k: number,
    evt: FederatedPointerEvent | TouchEvent,
    append = false,
  ) {
    if (useGame.getState().mode === MODE_PEN) {
      // do nothing in pen mode
      return
    }

    let action: SelectionAction["action"] = append ? ACTION_PUSH : ACTION_SET
    if (evt instanceof FederatedPointerEvent) {
      let oe = evt.originalEvent
      let ne = oe.nativeEvent
      if ("metaKey" in ne) {
        if (ne.metaKey || ne.ctrlKey) {
          if (ne.shiftKey) {
            action = ACTION_REMOVE
          } else {
            action = ACTION_PUSH
          }
        }
      }
    }

    useGame.getState().updateGame({
      type: TYPE_SELECTION,
      action,
      k,
    })
  }
}

export default Cell
