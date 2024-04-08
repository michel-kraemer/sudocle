import { FogLight } from "../types/Data"
import { Digit } from "../types/Game"
import { ThemeColours } from "./ThemeColours"
import { Graphics, Sprite, Text } from "pixi.js"

export interface WithGraphicsExData {
  // TODO why are these fields optional? Are they not necessary for some classes?
  readonly k?: number
  readonly borderColor?: number | undefined

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
