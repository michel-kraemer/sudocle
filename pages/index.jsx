import Grid from "../components/Grid"
import Pad from "../components/Pad"
import StatusBar from "../components/StatusBar"
import { eqCell } from "../components/lib/utils"
import { TYPE_MODE, TYPE_DIGITS, TYPE_CORNER_MARKS, TYPE_CENTRE_MARKS, TYPE_COLOURS,
  TYPE_SELECTION, TYPE_UNDO, TYPE_REDO, TYPE_RESTART, TYPE_CHECK,
  ACTION_SET, ACTION_PUSH, ACTION_CLEAR, ACTION_REMOVE, ACTION_ROTATE,
  ACTION_RIGHT, ACTION_LEFT, ACTION_UP, ACTION_DOWN } from "../components/lib/Actions"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "../components/lib/Modes"
import { useEffect, useReducer } from "react"
import Head from "next/head"
import { isEqual } from "lodash"
import styles from "./index.scss"

const DATABASE_URL = "https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/{}?alt=media"

function makeGivenDigits(data) {
  if (data === undefined || data.cells === undefined) {
    return []
  }

  let r = []
  data.cells.forEach((row, y) => {
    row.forEach((col, x) => {
      if (col.value !== undefined) {
        r.push({
          data: {
            row: y,
            col: x
          },
          digit: col.value,
          given: true
        })
      }
    })
  })
  return r
}

function makeEmptyState(data) {
  return {
    data,
    mode: MODE_NORMAL,
    previousModes: [],
    digits: makeGivenDigits(data),
    cornerMarks: [],
    centreMarks: [],
    colours: [],
    selection: [],
    errors: [],
    undoStates: [],
    nextUndoState: 0,
    solved: (data || {}).solved || false
  }
}

function filterGivens(digits, selection) {
  let r = []
  for (let sc of selection) {
    let cell = digits.find(d => eqCell(sc, d.data))
    if (cell === undefined || !cell.given) {
      r.push(sc)
    }
  }
  return r
}

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

function selectionReducer(state, action, cells = []) {
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

  if (state.length > 0 && (action.action === ACTION_RIGHT ||
      action.action === ACTION_LEFT || action.action === ACTION_UP ||
      action.action === ACTION_DOWN)) {
    if (!action.append && state.length > 1) {
      return [state[state.length - 1]]
    }

    let newState
    if (action.append) {
      newState = [...state]
    } else {
      newState = []
    }

    let oldCell = state[state.length - 1]
    let rowLength = cells[oldCell.row]?.length || 1
    let colLength = cells.length
    switch (action.action) {
      case ACTION_RIGHT: {
        let newCol = (oldCell.col + 1) % rowLength
        newState = [...newState, { ...oldCell, col: newCol }]
        break
      }
      case ACTION_LEFT: {
        let newCol = (oldCell.col - 1 + rowLength) % rowLength
        newState = [...newState, { ...oldCell, col: newCol }]
        break
      }
      case ACTION_UP: {
        let newRow = (oldCell.row - 1 + colLength) % colLength
        newState = [...newState, { ...oldCell, row: newRow }]
        break
      }
      case ACTION_DOWN: {
        let newRow = (oldCell.row + 1) % colLength
        newState = [...newState, { ...oldCell, row: newRow }]
        break
      }
    }

    return newState
  }

  return state
}

function checkDuplicates(grid) {
  let r = []
  for (let y = 0; y < grid.length; ++y) {
    let cells = grid[y]
    if (cells !== undefined) {
      for (let x = 0; x < cells.length; ++x) {
        for (let x2 = x + 1; x2 < cells.length; ++x2) {
          if (cells[x] === cells[x2]) {
            r.push([y, x])
            r.push([y, x2])
          }
        }
      }
    }
  }
  return r
}

function checkReducer(digits, cells = []) {
  let errors = []
  let gridByRow = []
  let gridByCol = []

  // check for empty cells
  cells.forEach((row, y) => {
    row.forEach((col, x) => {
      let d = digits.find(c => c.data.row === y && c.data.col === x)
      if (d === undefined) {
        errors.push({ row: y, col: x })
      } else {
        gridByRow[y] = gridByRow[y] || []
        gridByRow[y][x] = d.digit
        gridByCol[x] = gridByCol[x] || []
        gridByCol[x][y] = d.digit
      }
    })
  })

  // check for duplicate digits in rows
  checkDuplicates(gridByRow).forEach(e => errors.push({ row: e[0], col: e[1] }))

  // check for duplicate digits in cols
  checkDuplicates(gridByCol).forEach(e => errors.push({ row: e[1], col: e[0] }))

  if (errors.length > 0) {
    alert("That doesn't look right!")
  } else {
    alert("Looks good to me!")
  }

  return errors
}

function gameReducerNoUndo(state, mode, action) {
  switch (action.type) {
    case TYPE_MODE:
      return {
        ...state,
        ...modeReducer(mode, state.previousModes, action)
      }

    case TYPE_DIGITS:
      switch (mode) {
        case MODE_CORNER:
          return {
            ...state,
            cornerMarks: marksReducer(state.cornerMarks, action,
              filterGivens(state.digits, state.selection))
          }
        case MODE_CENTRE:
          return {
            ...state,
            centreMarks: marksReducer(state.centreMarks, action,
              filterGivens(state.digits, state.selection))
          }
        case MODE_COLOUR:
          return {
            ...state,
            colours: digitsReducer(state.colours, action, state.selection, "colour")
          }
      }
      return {
        ...state,
        digits: digitsReducer(state.digits, action,
          filterGivens(state.digits, state.selection))
      }

    case TYPE_SELECTION:
      return {
        ...state,
        selection: selectionReducer(state.selection, action, state.data?.cells)
      }
  }
  return state
}

function makeUndoState(state) {
  return {
    digits: state.digits,
    cornerMarks: state.cornerMarks,
    centreMarks: state.centreMarks,
    colours: state.colours
  }
}

function gameReducer(state, action) {
  if (action.type === TYPE_RESTART) {
    return makeEmptyState(action.data || state.data)
  }

  if (action.type === TYPE_UNDO) {
    if (state.nextUndoState === 0) {
      return state
    }
    let oldState = state.undoStates[state.nextUndoState - 1]
    let newUndoStates = state.undoStates
    if (state.nextUndoState === newUndoStates.length) {
      newUndoStates = [...newUndoStates, makeUndoState(state)]
    }
    return {
      ...state,
      ...makeUndoState(oldState),
      undoStates: newUndoStates,
      nextUndoState: state.nextUndoState - 1
    }
  }

  if (action.type === TYPE_REDO) {
    if (state.nextUndoState >= state.undoStates.length - 1) {
      return state
    }
    let oldState = state.undoStates[state.nextUndoState + 1]
    return {
      ...state,
      ...makeUndoState(oldState),
      nextUndoState: state.nextUndoState + 1
    }
  }

  if (action.type === TYPE_CHECK) {
    let errors = checkReducer(state.digits, state.data?.cells)
    return {
      ...state,
      errors,
      solved: state.solved || errors.length === 0
    }
  }

  let newState = state
  if ((action.type === TYPE_DIGITS || action.type === TYPE_CORNER_MARKS ||
      action.type === TYPE_CENTRE_MARKS || action.type === TYPE_COLOURS) &&
      action.action === ACTION_REMOVE) {
    let deleteColour = false
    if (newState.mode === MODE_COLOUR) {
      for (let sc of state.selection) {
        deleteColour = newState.colours.some(c => eqCell(sc, c.data))
        if (deleteColour) {
          break
        }
      }
    }
    let highest = MODE_COLOUR
    if (!deleteColour) {
      for (let sc of state.selection) {
        let hasDigit = newState.digits.some(c => eqCell(sc, c.data))
        if (hasDigit) {
          highest = MODE_NORMAL
          break
        }
        let hasCentreMarks = newState.centreMarks.some(c => eqCell(sc, c.data))
        if (hasCentreMarks && highest === MODE_COLOUR) {
          highest = MODE_CENTRE
        }
        let hasCornerMarks = newState.cornerMarks.some(c => eqCell(sc, c.data))
        if (hasCornerMarks && highest === MODE_COLOUR) {
          highest = MODE_CENTRE
        }
      }
      if (highest === MODE_CENTRE) {
        newState = gameReducerNoUndo(newState, MODE_CORNER, action)
      }
    }
    newState = gameReducerNoUndo(newState, highest, action)
  } else {
    newState = gameReducerNoUndo(newState, newState.mode, action)
  }

  if (newState !== state) {
    let us = makeUndoState(state)
    let nus = makeUndoState(newState)
    if (!isEqual(us, nus) && (state.nextUndoState === 0 ||
        !isEqual(state.undoStates[state.nextUndoState - 1], us))) {
      let newUndoStates = state.undoStates.slice(0, state.nextUndoState)
      newUndoStates[state.nextUndoState] = us
      newState = {
        ...newState,
        undoStates: newUndoStates,
        nextUndoState: state.nextUndoState + 1
      }
    }
  }

  return newState
}

const Index = () => {
  const [game, updateGame] = useReducer(gameReducer, makeEmptyState())

  function clearSelection() {
    updateGame({
      type: TYPE_SELECTION,
      action: ACTION_CLEAR
    })
  }

  // load game data
  useEffect(() => {
    let params = new URLSearchParams(window.location.search)
    let id = params.get("id")
    let url
    if (id === null || id === "") {
      url = "/empty-grid.json"
    } else {
      url = DATABASE_URL.replace("{}", id)
    }

    async function load() {
      let response = await fetch(url)
      let json = await response.json()
      // TODO better error handling
      if (json.error === undefined) {
        updateGame({
          type: TYPE_RESTART,
          data: json
        })
      }
    }

    // TODO better error handling
    load().catch(e => console.error(e))
  }, [])

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
      } else if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        updateGame({
          type: e.shiftKey ? TYPE_REDO : TYPE_UNDO
        })
        e.preventDefault()
      } else if (e.key === "y" && (e.metaKey || e.ctrlKey)) {
        updateGame({
          type: TYPE_REDO
        })
        e.preventDefault()
      } else if (e.code === "KeyZ") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_NORMAL
        })
        e.preventDefault()
      } else if (e.code === "KeyX") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_CORNER
        })
        e.preventDefault()
      } else if (e.code === "KeyC") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_CENTRE
        })
        e.preventDefault()
      } else if (e.code === "KeyV") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_COLOUR
        })
        e.preventDefault()
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_RIGHT,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_LEFT,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.code === "ArrowUp" || e.code === "KeyW") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_UP,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_DOWN,
          append: (e.metaKey || e.ctrlKey)
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
    <StatusBar solved={game.solved} />
    <div className="game-container" onClick={clearSelection}>
      <div className="grid-container">
        {game.data && <Grid game={game} updateGame={updateGame} />}
      </div>
      <Pad updateGame={updateGame} mode={game.mode} />
      <style jsx>{styles}</style>
    </div>
  </>)
}

export default Index
