import { xytok, ktoxy } from "../lib/utils"
import { TYPE_MODE, TYPE_DIGITS, TYPE_CORNER_MARKS, TYPE_CENTRE_MARKS, TYPE_COLOURS,
  TYPE_SELECTION, TYPE_UNDO, TYPE_REDO, TYPE_INIT, TYPE_CHECK,
  ACTION_ALL, ACTION_SET, ACTION_PUSH, ACTION_CLEAR, ACTION_REMOVE, ACTION_ROTATE,
  ACTION_RIGHT, ACTION_LEFT, ACTION_UP, ACTION_DOWN } from "../lib/Actions"
  import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "../lib/Modes"
import { createContext, useReducer } from "react"
import produce from "immer"
import { isEqual } from "lodash"

const State = createContext()
const Dispatch = createContext()

function makeGivenDigits(data) {
  if (data === undefined || data.cells === undefined) {
    return new Map()
  }

  let r = new Map()
  data.cells.forEach((row, y) => {
    row.forEach((col, x) => {
      if (col.value !== undefined) {
        let n = /^\d+$/.test(col.value) ? +col.value : col.value
        r.set(xytok(x, y), {
          digit: n,
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
    enabledModes: [MODE_NORMAL],
    digits: makeGivenDigits(data),
    cornerMarks: new Map(),
    centreMarks: new Map(),
    colours: new Map(),
    selection: new Set(),
    errors: new Set(),
    undoStates: [],
    nextUndoState: 0,
    solved: (data || {}).solved || false
  }
}

function filterGivens(digits, selection) {
  let r = []
  for (let sc of selection) {
    let cell = digits.get(sc)
    if (cell === undefined || !cell.given) {
      r.push(sc)
    }
  }
  return r
}

function modeReducer(draft, action) {
  let newEnabledModes = [...draft.enabledModes]
  switch (action.action) {
    case ACTION_SET:
      newEnabledModes = [action.mode]
      break

    case ACTION_PUSH:
      if (newEnabledModes.indexOf(action.mode) === -1) {
        newEnabledModes.push(action.mode)
      }
      break

    case ACTION_REMOVE: {
      let i = newEnabledModes.indexOf(action.mode)
      // Never remove the mode at position 0! It represents the previous one
      if (i >= 1) {
        newEnabledModes.splice(i, 1)
      }
      break
    }
  }

  let newMode = MODE_NORMAL
  if (newEnabledModes.length > 0) {
    newMode = newEnabledModes[newEnabledModes.length - 1]
  }

  if (action.action === ACTION_ROTATE) {
    switch (newMode) {
      case MODE_NORMAL:
        newMode = MODE_CORNER
        break
      case MODE_CORNER:
        newMode = MODE_CENTRE
        break
      case MODE_CENTRE:
        newMode = MODE_COLOUR
        break
      case MODE_COLOUR:
        newMode = MODE_NORMAL
        break
    }
    newEnabledModes = [newMode]
  }

  draft.mode = newMode
  draft.enabledModes = newEnabledModes
}

function marksReducer(marks, action, selection) {
  switch (action.action) {
    case ACTION_SET: {
      for (let sc of selection) {
        let digits = marks.get(sc)
        if (digits === undefined) {
          digits = new Set()
          marks.set(sc, digits)
        }
        if (digits.has(action.digit)) {
          digits.delete(action.digit)
        } else {
          digits.add(action.digit)
        }
        if (digits.size === 0) {
          marks.delete(sc)
        }
      }
      break
    }

    case ACTION_REMOVE: {
      for (let sc of selection) {
        marks.delete(sc)
      }
      break
    }
  }
}

function digitsReducer(digits, action, selection, attrName = "digit") {
  switch (action.action) {
    case ACTION_SET: {
      for (let sc of selection) {
        digits.set(sc, {
          [attrName]: action.digit
        })
      }
      break
    }

    case ACTION_REMOVE: {
      for (let sc of selection) {
        digits.delete(sc)
      }
      break
    }
  }
}

function selectionReducer(selection, action, cells = []) {
  switch (action.action) {
    case ACTION_ALL:
      selection.clear()
      cells.forEach((row, y) => {
        row.forEach((col, x) => {
          selection.add(xytok(x, y))
        })
      })
      return
    case ACTION_CLEAR:
      selection.clear()
      return
    case ACTION_SET: {
      selection.clear()
      if (Array.isArray(action.k)) {
        for (let k of action.k) {
          selection.add(k)
        }
      } else {
        selection.add(action.k)
      }
      return
    }
    case ACTION_PUSH: {
      if (Array.isArray(action.k)) {
        for (let k of action.k) {
          selection.add(k)
        }
      } else {
        selection.add(action.k)
      }
      return
    }
    case ACTION_REMOVE: {
      if (Array.isArray(action.k)) {
        for (let k of action.k) {
          selection.delete(k)
        }
      } else {
        selection.delete(action.k)
      }
      return
    }
  }

  if (selection.size > 0 && (action.action === ACTION_RIGHT ||
      action.action === ACTION_LEFT || action.action === ACTION_UP ||
      action.action === ACTION_DOWN)) {
    let last = [...selection].pop()
    if (!action.append) {
      selection.clear()
    }

    let [lastX, lastY] = ktoxy(last)
    let rowLength = cells[lastY]?.length || 1
    let colLength = cells.length

    let newK
    switch (action.action) {
      case ACTION_RIGHT:
        newK = xytok((lastX + 1) % rowLength, lastY)
        break
      case ACTION_LEFT:
        newK = xytok((lastX - 1 + rowLength) % rowLength, lastY)
        break
      case ACTION_UP:
        newK = xytok(lastX, (lastY - 1 + colLength) % colLength)
        break
      case ACTION_DOWN:
        newK = xytok(lastX, (lastY + 1) % colLength)
        break
    }

    if (newK !== undefined) {
      // re-add key so element becomes last in set
      selection.delete(newK)
      selection.add(newK)
    }
  }
}

function checkDuplicates(grid, errors, flip = false) {
  for (let y = 0; y < grid.length; ++y) {
    let cells = grid[y]
    if (cells !== undefined) {
      for (let x = 0; x < cells.length; ++x) {
        for (let x2 = x + 1; x2 < cells.length; ++x2) {
          if (cells[x] !== undefined && cells[x2] !== undefined &&
              cells[x] === cells[x2]) {
            if (flip) {
              errors.add(xytok(y, x))
              errors.add(xytok(y, x2))
            } else {
              errors.add(xytok(x, y))
              errors.add(xytok(x2, y))
            }
          }
        }
      }
    }
  }
}

function checkReducer(digits, cells = []) {
  let errors = new Set()
  let gridByRow = []
  let gridByCol = []

  // check for empty cells
  cells.forEach((row, y) => {
    row.forEach((col, x) => {
      let k = xytok(x, y)
      let d = digits.get(k)
      if (d === undefined) {
        errors.add(k)
      } else {
        gridByRow[y] = gridByRow[y] || []
        gridByRow[y][x] = d.digit
        gridByCol[x] = gridByCol[x] || []
        gridByCol[x][y] = d.digit
      }
    })
  })

  // check for duplicate digits in rows
  checkDuplicates(gridByRow, errors)

  // check for duplicate digits in cols
  checkDuplicates(gridByCol, errors, true)

  if (errors.size > 0) {
    alert("That doesn't look right!")
  } else {
    alert("Looks good to me!")
  }

  return errors
}

function gameReducerNoUndo(state, mode, action) {
  switch (action.type) {
    case TYPE_MODE:
      modeReducer(state, action)
      return

    case TYPE_DIGITS:
      switch (mode) {
        case MODE_CORNER:
          marksReducer(state.cornerMarks, action,
            filterGivens(state.digits, state.selection))
          return
        case MODE_CENTRE:
          marksReducer(state.centreMarks, action,
            filterGivens(state.digits, state.selection))
          return
      }
      digitsReducer(state.digits, action,
        filterGivens(state.digits, state.selection))
      return

    case TYPE_COLOURS:
      digitsReducer(state.colours, action, state.selection, "colour")
      return

    case TYPE_SELECTION:
      selectionReducer(state.selection, action, state.data?.cells)
      return
  }
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
  return produce(state, draft => {
    if (action.type === TYPE_INIT) {
      return makeEmptyState(action.data)
    }

    // clear errors on every interaction
    if (draft.errors.size > 0) {
      draft.errors.clear()
    }

    if (action.type === TYPE_UNDO) {
      if (draft.nextUndoState === 0) {
        return
      }
      let oldState = draft.undoStates[draft.nextUndoState - 1]
      if (draft.nextUndoState === draft.undoStates.length) {
        draft.undoStates.push(makeUndoState(draft))
      }
      Object.assign(draft, makeUndoState(oldState))
      draft.nextUndoState = draft.nextUndoState - 1
      return
    }

    if (action.type === TYPE_REDO) {
      if (draft.nextUndoState >= draft.undoStates.length - 1) {
        return
      }
      let oldState = draft.undoStates[draft.nextUndoState + 1]
      Object.assign(draft, makeUndoState(oldState))
      draft.nextUndoState = draft.nextUndoState + 1
      return
    }

    if (action.type === TYPE_CHECK) {
      draft.errors = checkReducer(draft.digits, draft.data?.cells)
      if (!draft.solved) {
        draft.solved = draft.errors.size === 0
      }
      return
    }

    if ((action.type === TYPE_DIGITS || action.type === TYPE_CORNER_MARKS ||
        action.type === TYPE_CENTRE_MARKS || action.type === TYPE_COLOURS) &&
        action.action === ACTION_REMOVE) {
      let deleteColour = false
      if (draft.mode === MODE_COLOUR) {
        for (let sc of draft.selection) {
          deleteColour = draft.colours.has(sc)
          if (deleteColour) {
            break
          }
        }
      }
      let highest = MODE_COLOUR
      if (!deleteColour) {
        for (let sc of draft.selection) {
          let digit = draft.digits.get(sc)
          if (digit !== undefined && !digit.given) {
            highest = MODE_NORMAL
            break
          }
          if (highest === MODE_COLOUR && draft.centreMarks.has(sc)) {
            highest = MODE_CENTRE
          } else if (highest === MODE_COLOUR && draft.cornerMarks.has(sc)) {
            highest = MODE_CENTRE
          }
        }
        if (highest === MODE_CENTRE) {
          gameReducerNoUndo(draft, MODE_CORNER, action)
        }
      }
      if (highest === MODE_COLOUR) {
        gameReducerNoUndo(draft, highest, { ...action, type: TYPE_COLOURS })
      } else {
        gameReducerNoUndo(draft, highest, action)
      }
    } else {
      gameReducerNoUndo(draft, draft.mode, action)
    }

    let us = makeUndoState(state)
    let nus = makeUndoState(draft)
    if (!isEqual(us, nus) && (draft.nextUndoState === 0 ||
        !isEqual(draft.undoStates[draft.nextUndoState - 1], us))) {
      let newUndoStates = draft.undoStates.slice(0, draft.nextUndoState)
      newUndoStates[draft.nextUndoState] = us
      draft.undoStates = newUndoStates
      draft.nextUndoState = draft.nextUndoState + 1
    }
  })
}

const Provider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, makeEmptyState())

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
