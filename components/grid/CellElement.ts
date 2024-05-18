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
import { GridElement } from "./GridElement"
import { ThemeColours } from "./ThemeColours"
import { FederatedPointerEvent, Graphics, Rectangle } from "pixi.js"

class CellElement implements GridElement {
  private x: number
  private y: number
  readonly k: number
  private hideBorder: boolean
  readonly graphics: Graphics

  constructor(x: number, y: number, hideBorder: boolean = false) {
    this.x = x
    this.y = y
    this.k = xytok(x, y)
    this.hideBorder = hideBorder

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

  clear() {
    this.graphics.clear()
  }

  draw(options: { cellSize: number; themeColours: ThemeColours }) {
    this.graphics.rect(0, 0, options.cellSize, options.cellSize)
    this.graphics.stroke({
      // Even if `this.hideBorder` is true, we need to draw something.
      // Otherwise, the bounding rectangle cannot be calculated correctly
      width: this.hideBorder ? 0 : 1,
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

export default CellElement
