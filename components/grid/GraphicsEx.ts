import { FogLight } from "../types/Data"
import { Digit } from "../types/Game"
import { ThemeColours } from "./ThemeColours"
import { Graphics, Sprite, Text } from "pixi.js"

export interface WithGraphicsExData {
  // TODO do we really need to expose this?
  readonly graphics: Graphics

  draw: (options: {
    cellSize: number
    zoomFactor: number
    currentDigits: Map<number, Digit>
    currentFogLights: FogLight[] | undefined
    currentFogRaster: number[][] | undefined
    themeColours: ThemeColours
  }) => void
}

// TODO use composition instead of inheritance
export type GraphicsEx = WithGraphicsExData

export type TextEx = Text & WithGraphicsExData

export type SpriteEx = Sprite & WithGraphicsExData
