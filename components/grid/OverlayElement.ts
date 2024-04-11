import { getAlpha, getRGBColor, isGrey } from "../lib/colorutils"
import { cellToScreenCoords } from "../lib/utils"
import { Overlay } from "../types/Data"
import { SCALE_FACTOR } from "./Grid"
import { GridElement } from "./GridElement"
import Color from "color"
import { Container, Graphics, Text } from "pixi.js"

class OverlayElement implements GridElement {
  private readonly overlay: Overlay
  private readonly graphics?: Graphics
  private readonly text?: Text
  private readonly fontSize?: number
  readonly container: Container

  constructor(overlay: Overlay, fontFamily: string) {
    this.overlay = overlay

    this.container = new Container()

    if (
      overlay.backgroundColor !== undefined ||
      overlay.borderColor !== undefined
    ) {
      this.graphics = new Graphics()
      this.container.addChild(this.graphics)

      if (overlay.rotation !== undefined) {
        this.graphics.rotation = overlay.rotation
      }
    }

    if (overlay.text !== undefined && overlay.text !== "") {
      this.fontSize = (overlay.fontSize ?? 20) * SCALE_FACTOR
      if (overlay.fontSize !== undefined && overlay.fontSize < 14) {
        this.fontSize *= 1 / 0.75
      }

      this.text = new Text({
        text: overlay.text,
        style: {
          fontFamily,
          fontSize: this.fontSize,
        },
      })

      if (overlay.fontColor) {
        this.text.style.fill = overlay.fontColor
      }

      if (overlay.backgroundColor !== undefined) {
        let bgc = Color(overlay.backgroundColor)
        if (Color(overlay.fontColor ?? "#000").contrast(bgc) < 2) {
          // text would be invisible on top of background
          if (bgc.isDark()) {
            this.text.style.stroke = { color: "#fff", width: 3 }
          } else {
            this.text.style.stroke = { color: "#000", width: 3 }
          }
        }
      }

      if (overlay.rotation !== undefined) {
        this.text.rotation = overlay.rotation
      }

      this.text.anchor.set(0.5)
      this.text.style.align = "center"

      if (overlay.fontSize !== undefined && overlay.fontSize < 14) {
        this.text.scale.x = 0.75
        this.text.scale.y = 0.75
      }

      this.container.addChild(this.text)
    }
  }

  clear() {
    this.graphics?.clear()
  }

  draw(options: {
    cellSize: number
    zoomFactor: number
    gridOffset: { x: number; y: number }
  }) {
    let center = cellToScreenCoords(
      this.overlay.center,
      options.gridOffset.x,
      options.gridOffset.y,
      options.cellSize,
    )

    if (this.graphics !== undefined) {
      this.graphics.x = center[0]
      this.graphics.y = center[1]

      let w = this.overlay.width * options.cellSize
      let h = this.overlay.height * options.cellSize

      if (this.overlay.rounded) {
        if (w === h) {
          this.graphics.ellipse(0, 0, w / 2, h / 2)
        } else {
          // we divide by 2.27 instead of 2 here because we want the same
          // look as we had with Pixi 6, which wasn't able to correctly round
          // the rectangle
          this.graphics.roundRect(
            -w / 2,
            -h / 2,
            w,
            h,
            Math.min(w, h) / 2.27 - 1,
          )
        }
      } else {
        this.graphics.rect(-w / 2, -h / 2, w, h)
      }

      let nBackgroundColour
      if (this.overlay.backgroundColor !== undefined) {
        nBackgroundColour = getRGBColor(this.overlay.backgroundColor)
        let alpha = getAlpha(this.overlay.backgroundColor)
        if (alpha === 1) {
          alpha = isGrey(nBackgroundColour) ? 1 : 0.5
        }
        this.graphics.fill({ color: nBackgroundColour, alpha })
      }

      if (this.overlay.borderColor !== undefined) {
        let nBorderColour = getRGBColor(this.overlay.borderColor)
        if (
          nBorderColour !== nBackgroundColour &&
          !(
            this.overlay.width === 1 &&
            this.overlay.height === 1 &&
            !this.overlay.rounded &&
            isGrey(nBorderColour)
          )
        ) {
          this.graphics.stroke({
            width: this.overlay.thickness ?? 2,
            color: nBorderColour,
            alpha: isGrey(nBorderColour) ? 1 : 0.5,
            alignment: 1,
          })
        }
      }
    }

    if (this.text !== undefined) {
      this.text.x = center[0]
      this.text.y = center[1]
      this.text.style.fontSize = Math.round(this.fontSize! * options.zoomFactor)
    }
  }
}

export default OverlayElement
