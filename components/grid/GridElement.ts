import { Colour } from "../hooks/useGame"
import { FogLight } from "../types/Data"
import { Digit } from "../types/Game"
import { ThemeColours } from "./ThemeColours"
import _ from "lodash"
import memoizeOne from "memoize-one"

export interface DrawOptions {
  cellSize: number
  zoomFactor: number
  unitSize: number
  currentColours: Map<number, Colour>
  currentDigits: Map<number, Digit>
  currentFogLights: FogLight[] | undefined
  currentFogRaster: number[][] | undefined
  themeColours: ThemeColours
  paletteColours: number[]
  palettePenColours: number[]
  gridOffset: { x: number; y: number }
}

export enum DrawOptionField {
  CellSize,
  CurrentColours,
  CurrentDigits,
  CurrentFogLights,
  CurrentFogRaster,
  GridOffset,
  PaletteColours,
  PalettePenColours,
  ThemeColours,
  UnitSize,
  ZoomFactor,
}

export function memoizeDraw(
  draw: (options: DrawOptions) => void,
  optionsToMemoize: DrawOptionField[],
): (options: DrawOptions) => void {
  return memoizeOne(
    draw,
    (newInputs: [DrawOptions], lastInputs: [DrawOptions]) => {
      for (let otm of optionsToMemoize) {
        switch (otm) {
          case DrawOptionField.CellSize:
            if (newInputs[0].cellSize !== lastInputs[0].cellSize) {
              return false
            }
            break

          case DrawOptionField.CurrentColours:
            if (
              !_.isEqual(
                newInputs[0].currentColours,
                lastInputs[0].currentColours,
              )
            ) {
              return false
            }
            break

          case DrawOptionField.CurrentDigits:
            if (
              !_.isEqual(
                newInputs[0].currentDigits,
                lastInputs[0].currentDigits,
              )
            ) {
              return false
            }
            break

          case DrawOptionField.CurrentFogLights:
            if (
              !_.isEqual(
                newInputs[0].currentFogLights,
                lastInputs[0].currentFogLights,
              )
            ) {
              return false
            }
            break

          case DrawOptionField.CurrentFogRaster:
            if (
              !_.isEqual(
                newInputs[0].currentFogRaster,
                lastInputs[0].currentFogRaster,
              )
            ) {
              return false
            }
            break

          case DrawOptionField.GridOffset:
            if (!_.isEqual(newInputs[0].gridOffset, lastInputs[0].gridOffset)) {
              return false
            }
            break

          case DrawOptionField.PaletteColours:
            if (
              !_.isEqual(
                newInputs[0].paletteColours,
                lastInputs[0].paletteColours,
              )
            ) {
              return false
            }
            break

          case DrawOptionField.PalettePenColours:
            if (
              !_.isEqual(
                newInputs[0].palettePenColours,
                lastInputs[0].palettePenColours,
              )
            ) {
              return false
            }
            break

          case DrawOptionField.ThemeColours:
            if (
              !_.isEqual(newInputs[0].themeColours, lastInputs[0].themeColours)
            ) {
              return false
            }
            break

          case DrawOptionField.UnitSize:
            if (newInputs[0].unitSize !== lastInputs[0].unitSize) {
              return false
            }
            break

          case DrawOptionField.ZoomFactor:
            if (newInputs[0].zoomFactor !== lastInputs[0].zoomFactor) {
              return false
            }
            break
        }
      }
      return true
    },
  )
}

export interface GridElement {
  clear(): void
  drawOptionsToMemoize(): DrawOptionField[]
  draw(options: DrawOptions): void
}
