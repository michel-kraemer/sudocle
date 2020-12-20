import Grid from "../components/Grid"
import Pad from "../components/Pad"
import StatusBar from "../components/StatusBar"
import { eqCell } from "../components/lib/utils"
import { TYPE_DIGITS, TYPE_SELECTION, ACTION_SET, ACTION_PUSH, ACTION_CLEAR, ACTION_REMOVE } from "../components/lib/Actions"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "../components/lib/Modes"
import { useEffect, useReducer } from "react"
import Head from "next/head"
import styles from "./index.scss"

function digitsReducer(state, action, selection) {
  switch (action.action) {
    case ACTION_SET: {
      let newState = state
      for (let sc of selection) {
        newState = [...newState.filter(c => !eqCell(sc, c.data)), {
          data: sc,
          digit: action.digit
        }]
      }
      return newState
    }

    case ACTION_REMOVE: {
      let newState = state
      for (let sc of selection) {
        newState = [...newState.filter(c => !eqCell(sc, c.data))]
      }
      return newState
    }
  }
  return state
}

function selectionReducer(state, action) {
  switch (action.action) {
    case ACTION_CLEAR:
      return []
    case ACTION_SET:
      return [action.data]
    case ACTION_PUSH:
      return [...state, action.data]
    case ACTION_REMOVE:
      return [...state.filter(c => !eqCell(c, action.data))]
  }
  return state
}

function gameReducer(state, action) {
  switch (action.type) {
    case TYPE_DIGITS:
      return {
        ...state,
        digits: digitsReducer(state.digits, action, state.selection)
      }

    case TYPE_SELECTION:
      return {
        ...state,
        selection: selectionReducer(state.selection, action)
      }
  }
  return state
}

function modeReducer(state, action) {
  switch (action.type) {
    case "set":
      return {
        currentMode: action.mode,
        allModes: []
      }

    case "push":
      return {
        currentMode: action.mode,
        allModes: [...state.allModes, state.currentMode]
      }

    case "pop":
      return {
        currentMode: state.allModes[state.allModes.length - 1],
        allModes: state.allModes.slice(0, state.allModes.length - 1)
      }

    case "rotate": {
      let newMode = MODE_NORMAL
      switch (state.currentMode) {
        case MODE_NORMAL:
          newMode = MODE_CORNER
          break
        case MODE_CORNER:
          newMode = MODE_CENTRE
          break
        case MODE_CENTRE:
          newMode = MODE_COLOUR
          break
      }
      return {
        currentMode: newMode,
        allModes: state.allModes
      }
    }
  }
  return state
}

const Index = () => {
  const [mode, updateMode] = useReducer(modeReducer, {
    currentMode: MODE_NORMAL,
    allModes: []
  })

  const [game, updateGame] = useReducer(gameReducer, {
    digits: [],
    selection: []
  })

  function clearSelection() {
    updateGame({
      type: TYPE_SELECTION,
      action: ACTION_CLEAR
    })
  }

  function setMode(newMode) {
    updateMode({ type: "set", mode: newMode })
  }

  // register keyboard handlers
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === " ") {
        updateMode({ type: "rotate" })
        e.preventDefault()
      } else if (e.key === "Meta" || e.key === "Control") {
        updateMode({ type: "push", mode: MODE_CENTRE })
        e.preventDefault()
      } else if (e.key === "Shift") {
        updateMode({ type: "push", mode: MODE_CORNER })
        e.preventDefault()
      } else if (e.key === "Alt") {
        updateMode({ type: "push", mode: MODE_COLOUR })
        e.preventDefault()
      }
    }

    function onKeyUp(e) {
      if (e.key === "Meta" || e.key === "Control" || e.key === "Shift" || e.key === "Alt") {
        updateMode({ type: "pop" })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    return () => {
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  return (<>
    <Head>
      <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
      <meta name="description" content="Sudoku"/>
      <meta name="robots" content="index,follow"/>
      <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet"/>
      <title>Sudoku</title>
    </Head>
    <StatusBar />
    <div className="game-container" onClick={clearSelection}>
      <div className="grid-container">
        <Grid game={game} updateGame={updateGame} mode={mode.currentMode} />
      </div>
      <Pad updateGame={updateGame} mode={mode.currentMode} setMode={setMode} />
      <style jsx>{styles}</style>
    </div>
  </>)
}

export default Index
