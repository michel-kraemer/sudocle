import Grid from "../components/Grid"
import Pad from "../components/Pad"
import StatusBar from "../components/StatusBar"
import { eqCell } from "../components/lib/utils"
import { TYPE_MODE, TYPE_DIGITS, TYPE_SELECTION, ACTION_SET, ACTION_PUSH,
  ACTION_CLEAR, ACTION_REMOVE, ACTION_ROTATE } from "../components/lib/Actions"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "../components/lib/Modes"
import { useEffect, useReducer } from "react"
import Head from "next/head"
import styles from "./index.scss"

function modeReducer(mode, previousModes, action) {
  switch (action.action) {
    case ACTION_SET:
      return {
        mode: action.mode,
        previousModes: []
      }

    case ACTION_PUSH:
      return {
        mode: action.mode,
        previousModes: [...previousModes, mode]
      }

    case ACTION_REMOVE:
      return {
        mode: previousModes[previousModes.length - 1],
        previousModes: previousModes.slice(0, previousModes.length - 1)
      }

    case ACTION_ROTATE: {
      let newMode = MODE_NORMAL
      switch (mode) {
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
        mode: newMode,
        previousModes
      }
    }
  }
  return {
    mode,
    previousModes
  }
}

function marksReducer(state, action, selection) {
  switch (action.action) {
    case ACTION_SET: {
      let newState = [...state]
      for (let sc of selection) {
        let existingCell = newState.findIndex(c => eqCell(sc, c.data))
        let newDigits
        if (existingCell === -1) {
          newDigits = []
        } else {
          newDigits = [...newState[existingCell].digits]
          newState.splice(existingCell, 1)
        }
        if (newDigits[action.digit] !== undefined) {
          delete newDigits[action.digit]
        } else {
          newDigits[action.digit] = action.digit
        }
        while (newDigits.length > 0 && newDigits[newDigits.length - 1] === undefined) {
          newDigits.pop()
        }
        if (newDigits.length > 0) {
          newState.push({
            data: sc,
            digits: newDigits
          })
        }
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

function digitsReducer(state, action, selection, attrName = "digit") {
  switch (action.action) {
    case ACTION_SET: {
      let newState = state
      for (let sc of selection) {
        newState = [...newState.filter(c => !eqCell(sc, c.data)), {
          data: sc,
          [attrName]: action.digit
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
    case TYPE_MODE:
      return {
        ...state,
        ...modeReducer(state.mode, state.previousModes, action)
      }

    case TYPE_DIGITS:
      switch (state.mode) {
        case MODE_CORNER:
          return {
            ...state,
            cornerMarks: marksReducer(state.cornerMarks, action, state.selection)
          }
        case MODE_CENTRE:
          return {
            ...state,
            centreMarks: marksReducer(state.centreMarks, action, state.selection)
          }
        case MODE_COLOUR:
          return {
            ...state,
            colours: digitsReducer(state.colours, action, state.selection, "colour")
          }
      }
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

const Index = () => {
  const [game, updateGame] = useReducer(gameReducer, {
    mode: MODE_NORMAL,
    previousModes: [],
    digits: [],
    cornerMarks: [],
    centreMarks: [],
    colours: [],
    selection: []
  })

  function clearSelection() {
    updateGame({
      type: TYPE_SELECTION,
      action: ACTION_CLEAR
    })
  }

  // register keyboard handlers
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === " ") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_ROTATE
        })
        e.preventDefault()
      } else if (e.key === "Meta" || e.key === "Control") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_CENTRE
        })
        e.preventDefault()
      } else if (e.key === "Shift") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_CORNER
        })
        e.preventDefault()
      } else if (e.key === "Alt") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_COLOUR
        })
        e.preventDefault()
      }
    }

    function onKeyUp(e) {
      if (e.key === "Meta" || e.key === "Control" || e.key === "Shift" || e.key === "Alt") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_REMOVE
        })
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
        <Grid game={game} updateGame={updateGame} />
      </div>
      <Pad updateGame={updateGame} mode={game.mode} />
      <style jsx>{styles}</style>
    </div>
  </>)
}

export default Index
