import { createContext, useReducer } from "react"

const State = createContext()
const Dispatch = createContext()

const reducer = (state, { palette }) => {
  return {
    ...state, palette
  }
}

const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { palette: 0 })

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
