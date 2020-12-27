import { createContext, useReducer } from "react"
import { produce } from "immer"

const State = createContext()
const Dispatch = createContext()

const reducer = produce((draft, { theme }) => {
  if (theme !== undefined) {
    draft.theme = theme
  }
})

const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    theme: "default"
  })

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
