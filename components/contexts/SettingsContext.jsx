import { createContext, useEffect, useReducer } from "react"
import { produce } from "immer"

const LOCAL_STORAGE_KEY = "SudokuSettings"

const State = createContext()
const Dispatch = createContext()

const reducer = produce((draft, { colourPalette, theme }) => {
  if (colourPalette !== undefined) {
    draft.colourPalette = colourPalette
  }
  if (theme !== undefined) {
    draft.theme = theme
  }
})

const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    colourPalette: "default",
    theme: "default"
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
