import { create } from "zustand"
import { persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"

interface Settings {
  colourPalette: string
  theme: string
  selectionColour: "yellow" | "red" | "green" | "blue"
  customColours: string[]
  zoom: number
  fontSizeFactorDigits: number
  fontSizeFactorCornerMarks: number
  fontSizeFactorCentreMarks: number

  setColourPalette(colourPalette: string): void
  setTheme(theme: string): void
  setSelectionColour(selectionColour: Settings["selectionColour"]): void
  setCustomColours(customColours: string[]): void
  setZoom(zoom: number): void
  setFontSizeFactorDigits(fontSizeFactorDigits: number): void
  setFontSizeFactorCornerMarks(fontSizeFactorCornerMarks: number): void
  setFontSizeFactorCentreMarks(fontSizeFactorCentreMarks: number): void
}

export const useSettings = create<Settings>()(
  persist(
    immer(set => ({
      colourPalette: "default",
      theme: "default",
      selectionColour: "yellow",
      customColours: [],
      zoom: 1,
      fontSizeFactorDigits: 1,
      fontSizeFactorCornerMarks: 1,
      fontSizeFactorCentreMarks: 1,

      setColourPalette: (colourPalette: string) => {
        set(draft => {
          draft.colourPalette = colourPalette
        })
      },

      setTheme: (theme: string) =>
        set(draft => {
          draft.theme = theme
        }),

      setSelectionColour: (selectionColour: Settings["selectionColour"]) =>
        set(draft => {
          draft.selectionColour = selectionColour
        }),

      setCustomColours: (customColours: string[]) =>
        set(draft => {
          draft.customColours = customColours
        }),

      setZoom: (zoom: number) =>
        set(draft => {
          draft.zoom = zoom
        }),

      setFontSizeFactorDigits: (fontSizeFactorDigits: number) =>
        set(draft => {
          draft.fontSizeFactorDigits = fontSizeFactorDigits
        }),

      setFontSizeFactorCornerMarks: (fontSizeFactorCornerMarks: number) =>
        set(draft => {
          draft.fontSizeFactorCornerMarks = fontSizeFactorCornerMarks
        }),

      setFontSizeFactorCentreMarks: (fontSizeFactorCentreMarks: number) =>
        set(draft => {
          draft.fontSizeFactorCentreMarks = fontSizeFactorCentreMarks
        })
    })),
    {
      name: "SudocleSettings"
    }
  )
)
