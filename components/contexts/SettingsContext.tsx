"use client"

import { createContext, ReactNode, useEffect, useReducer } from "react"
import { produce } from "immer"

interface Settings {
  colourPalette: string
  theme: string
  selectionColour: "yellow" | "red" | "green" | "blue"
  customColours: string[]
  zoom: number
  fontSizeFactorDigits: number
  fontSizeFactorCornerMarks: number
  fontSizeFactorCentreMarks: number
}

const DEFAULT_SETTINGS: Settings = {
  colourPalette: "default",
  theme: "default",
  selectionColour: "yellow",
  customColours: [],
  zoom: 1,
  fontSizeFactorDigits: 1,
  fontSizeFactorCornerMarks: 1,
  fontSizeFactorCentreMarks: 1
}

const LOCAL_STORAGE_KEY = "SudocleSettings"

export const State = createContext(DEFAULT_SETTINGS)
export const Dispatch = createContext((_: Partial<Settings>) => {})

const reducer = produce(
  (
    draft: Settings,
    {
      colourPalette,
      theme,
      selectionColour,
      customColours,
      zoom,
      fontSizeFactorDigits,
      fontSizeFactorCornerMarks,
      fontSizeFactorCentreMarks
    }: Partial<Settings>
  ) => {
    if (colourPalette !== undefined) {
      draft.colourPalette = colourPalette
    }
    if (theme !== undefined) {
      draft.theme = theme
    }
    if (selectionColour !== undefined) {
      draft.selectionColour = selectionColour
    }
    if (customColours !== undefined) {
      draft.customColours = customColours
    }
    if (zoom !== undefined) {
      draft.zoom = zoom
    }
    if (fontSizeFactorDigits !== undefined) {
      draft.fontSizeFactorDigits = fontSizeFactorDigits
    }
    if (fontSizeFactorCornerMarks !== undefined) {
      draft.fontSizeFactorCornerMarks = fontSizeFactorCornerMarks
    }
    if (fontSizeFactorCentreMarks !== undefined) {
      draft.fontSizeFactorCentreMarks = fontSizeFactorCentreMarks
    }
  }
)

interface ProviderProps {
  children: ReactNode
}

export const Provider = ({ children }: ProviderProps) => {
  const [state, dispatch] = useReducer(reducer, DEFAULT_SETTINGS)

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      let r = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (r !== undefined && r !== null) {
        let parsedSettings = JSON.parse(r) as Settings
        dispatch(parsedSettings)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  return (
    <State.Provider value={state}>
      <Dispatch.Provider value={dispatch}>{children}</Dispatch.Provider>
    </State.Provider>
  )
}
