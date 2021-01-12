import { createContext, useEffect, useReducer } from "react"
import { produce } from "immer"

const LOCAL_STORAGE_KEY = "SudokuSettings"

const State = createContext()
const Dispatch = createContext()

const reducer = produce((draft, { colourPalette, theme, selectionColour, zoom,
    fontSizeFactorDigits, fontSizeFactorCornerMarks, fontSizeFactorCentreMarks }) => {
  if (colourPalette !== undefined) {
    draft.colourPalette = colourPalette
  }
  if (theme !== undefined) {
    draft.theme = theme
  }
  if (selectionColour !== undefined) {
    draft.selectionColour = selectionColour
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
})

const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    colourPalette: "default",
    theme: "default",
    selectionColour: "yellow",
    zoom: 1,
    fontSizeFactorDigits: 1,
    fontSizeFactorCornerMarks: 1,
    fontSizeFactorCentreMarks: 1
  })

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      let r = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (r !== undefined && r !== null) {
        r = JSON.parse(r)
        dispatch(r)
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

export default {
  State,
  Dispatch,
  Provider
}
