import { xytok, ktoxy } from "../lib/utils"
import { Action, ColoursAction, DigitsAction, ModeAction, ModeGroupAction,
  PenLinesAction, SelectionAction, ACTION_ALL, ACTION_SET,
  ACTION_PUSH, ACTION_CLEAR, ACTION_REMOVE, ACTION_ROTATE, ACTION_RIGHT,
  ACTION_LEFT, ACTION_UP, ACTION_DOWN, TYPE_MODE, TYPE_MODE_GROUP,
  TYPE_DIGITS, TYPE_COLOURS, TYPE_PENLINES, TYPE_SELECTION, TYPE_UNDO,
  TYPE_REDO, TYPE_INIT, TYPE_CHECK, TYPE_PAUSE } from "../lib/Actions"
import { Data, DataCell, FogLight } from "../types/Data"
import { Digit } from "../types/Game"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR, MODE_PEN, Mode,
  getModeGroup } from "../lib/Modes"
import { createContext, ReactNode, useReducer } from "react"
import produce from "immer"
import { isEqual, isString } from "lodash"

const EmptyData: Data = {
  cellSize: 50,
  cells: [],
  regions: [],
  cages: [],
  lines: [],
  arrows: [],
  underlays: [],
  overlays: [],
  solved: false
}

interface Colour {
  colour: number
}

interface PersistentGameState {
  digits: Map<number, Digit>,
  cornerMarks: Map<number, Set<number | string>>,
  centreMarks: Map<number, Set<number | string>>,
  colours: Map<number, Colour>,
  penLines: Set<number>
}

interface GameState extends PersistentGameState {
  readonly data: Data,
  mode: Mode,
  modeGroup: number,
  enabledModes0: Mode[],
  enabledModes1: Mode[],
  selection: Set<number>,
  errors: Set<number>,
  undoStates: PersistentGameState[],
  nextUndoState: number,
  solved: boolean,
  paused: boolean,
  checkCounter: number
}

const State = createContext(makeEmptyState())
const Dispatch = createContext((_: Action) => {})

function makeGiven<T, R>(data: Data | undefined,
    accessor: (cell: DataCell) => T | undefined,
    generator: (value: T) => R): Map<number, R> {
  if (data === undefined || data.cells === undefined) {
    return new Map<number, R>()
  }

  let r = new Map<number, R>()
  data.cells.forEach((row, y) => {
    row.forEach((col, x) => {
      let v = accessor(col)
      if (v !== undefined && (!Array.isArray(v) || v.length > 0)) {
        r.set(xytok(x, y), generator(v))
      }
    })
  })
  return r
}

function makeGivenDigits(data: Data | undefined): Map<number, Digit> {
  return makeGiven(data, c => c.value, n => {
    if (isString(n)) {
      n = /^\d+$/.test(n) ? +n : n
    }
    return {
      digit: n,
      given: true
    }
  })
}

function makeGivenMarks<T extends (string | number)[]>(data: Data | undefined,
    accessor: (cell: DataCell) => T | undefined): Map<number, Set<string | number>> {
  return makeGiven(data, accessor, cms => {
    let digits = new Set<string | number>()
    for (let cm of cms) {
      let n = isString(cm) && /^\d+$/.test(cm) ? +cm : cm
      digits.add(n)
    }
    return digits
  })
}

function parseFogLights(str: string): FogLight[] {
  let result: FogLight[] = []
  let parts = str.split(/\s*[^a-z0-9]\s*/i)
  for (let cell of parts) {
    let m = cell.match(/r([0-9]+)c([0-9]+)/i)!
    result.push({
      center: [+m[1] - 1, +m[2] - 1],
      size: 1
    })
  }
  return result
}

function parseSolution(data: Data, str: string): (number | undefined)[][] {
  let solution: (number | undefined)[][] = []
  let i = 0
  for (let row of data.cells) {
    let srow: (number | undefined)[] = []
    solution!.push(srow)
    for (let _ of row) {
      let v = str[i++]
      let n: number | undefined
      if (v !== undefined && isString(v)) {
        n = +v
        if (isNaN(n)) {
          n = undefined
        }
      } else {
        n = v
      }
      if (n === 0) {
        n = undefined
      }
      srow.push(n)
    }
  }
  return solution
}

function makeEmptyState(data?: Data): GameState {
  return {
    data: data ?? EmptyData,
    mode: MODE_NORMAL,
    modeGroup: 0,
    enabledModes0: [MODE_NORMAL],
    enabledModes1: [MODE_PEN],
    digits: makeGivenDigits(data),
    cornerMarks: makeGivenMarks(data, c => c.cornermarks),
    centreMarks: makeGivenMarks(data, c => c.centremarks),
    colours: new Map(),
    penLines: new Set(),
    selection: new Set(),
    errors: new Set(),
    undoStates: [],
    nextUndoState: 0,
    solved: data?.solved ?? false,
    paused: false,
    checkCounter: 0
  }
}

function filterGivens(digits: Map<number, Digit>, selection: Set<number>): Set<number> {
  let r = new Set<number>()
  for (let sc of selection) {
    let cell = digits.get(sc)
    if (cell === undefined || !cell.given) {
      r.add(sc)
    }
  }
  return r
}

function modeReducer(draft: GameState, action: ModeAction) {
  let newEnabledModes
  if (draft.modeGroup === 0) {
    newEnabledModes = [...draft.enabledModes0]
  } else {
    newEnabledModes = [...draft.enabledModes1]
  }

  switch (action.action) {
    case ACTION_SET:
      if (action.mode !== undefined) {
        newEnabledModes = [action.mode]
        draft.modeGroup = getModeGroup(action.mode)
      }
      break

    case ACTION_PUSH:
      if (action.mode !== undefined) {
        if (!newEnabledModes.includes(action.mode)) {
          newEnabledModes.push(action.mode)
        }
      }
      break

    case ACTION_REMOVE: {
      if (action.mode !== undefined) {
        let i = newEnabledModes.indexOf(action.mode)
        // Never remove the mode at position 0! It represents the previous one
        if (i >= 1) {
          newEnabledModes.splice(i, 1)
        }
      }
      break
    }
  }

  let newMode: Mode
  if (draft.modeGroup === 0) {
    newMode = MODE_NORMAL
  } else {
    newMode = MODE_PEN
  }
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
      case MODE_PEN:
        newMode = MODE_PEN
        break
    }
    newEnabledModes = [newMode]
  }

  draft.mode = newMode
  if (draft.modeGroup === 0) {
    draft.enabledModes0 = newEnabledModes
  } else {
    draft.enabledModes1 = newEnabledModes
  }
}

function modeGroupReducer(draft: GameState, action: ModeGroupAction) {
  switch (action.action) {
    case ACTION_ROTATE:
      draft.modeGroup = (draft.modeGroup + 1) % 2
      if (draft.modeGroup === 0) {
        draft.mode = draft.enabledModes0[draft.enabledModes0.length - 1]
      } else {
        draft.mode = draft.enabledModes1[draft.enabledModes1.length - 1]
      }
      break
  }
}

function marksReducer(marks: Map<number, Set<string | number>>,
    action: DigitsAction, selection: Set<number>) {
  switch (action.action) {
    case ACTION_SET: {
      if (action.digit !== undefined) {
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

function digitsReducer(digits: Map<number, Digit>, action: DigitsAction,
    selection: Set<number>) {
  switch (action.action) {
    case ACTION_SET: {
      if (action.digit !== undefined) {
        for (let sc of selection) {
          digits.set(sc, {
            digit: action.digit,
            given: false
          })
        }
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

function coloursReducer(colours: Map<number, Colour>, action: ColoursAction,
    selection: Iterable<number>) {
  switch (action.action) {
    case ACTION_SET: {
      if (action.digit !== undefined) {
        for (let sc of selection) {
          colours.set(sc, {
            colour: action.digit
          })
        }
      }
      break
    }

    case ACTION_REMOVE: {
      for (let sc of selection) {
        colours.delete(sc)
      }
      break
    }
  }
}

function penLinesReducer(penLines: Set<number>, action: PenLinesAction) {
  switch (action.action) {
    case ACTION_PUSH: {
      if (Array.isArray(action.k)) {
        for (let k of action.k) {
          penLines.add(k)
        }
      } else {
        penLines.add(action.k)
      }
      return
    }

    case ACTION_REMOVE: {
      if (Array.isArray(action.k)) {
        for (let k of action.k) {
          penLines.delete(k)
        }
      } else {
        penLines.delete(action.k)
      }
      return
    }
  }
}

function selectionReducer(selection: Set<number>, action: SelectionAction,
    cells: DataCell[][] = []) {
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
      if (action.k !== undefined) {
        if (Array.isArray(action.k)) {
          for (let k of action.k) {
            selection.add(k)
          }
        } else {
          selection.add(action.k)
        }
      }
      return
    }
    case ACTION_PUSH: {
      if (action.k !== undefined) {
        if (Array.isArray(action.k)) {
          for (let k of action.k) {
            selection.add(k)
          }
        } else {
          selection.add(action.k)
        }
      }
      return
    }
    case ACTION_REMOVE: {
      if (action.k !== undefined) {
        if (Array.isArray(action.k)) {
          for (let k of action.k) {
            selection.delete(k)
          }
        } else {
          selection.delete(action.k)
        }
      }
      return
    }
  }

  if (selection.size > 0 && (action.action === ACTION_RIGHT ||
      action.action === ACTION_LEFT || action.action === ACTION_UP ||
      action.action === ACTION_DOWN)) {
    let last = [...selection].pop()!
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

function checkDuplicates(grid: (string | number)[][], errors: Set<number>, flip = false) {
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

function checkReducer(digits: Map<number, Digit>, cells: DataCell[][] = [],
    solution?: (number | undefined)[][]): Set<number> {
  let errors = new Set<number>()

  if (solution === undefined) {
    let gridByRow: (string | number)[][] = []
    let gridByCol: (string | number)[][] = []

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
  } else {
    cells.forEach((row, y) => {
      row.forEach((_, x) => {
        let k = xytok(x, y)
        let actual = digits.get(k)
        let expected = solution[y][x]
        if (expected !== undefined && expected !== actual?.digit) {
          errors.add(k)
        }
      })
    })
  }

  return errors
}

function gameReducerNoUndo(state: GameState, mode: string, action: Action) {
  switch (action.type) {
    case TYPE_MODE:
      modeReducer(state, action)
      return

    case TYPE_MODE_GROUP:
      modeGroupReducer(state, action)
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
      coloursReducer(state.colours, action, state.selection)
      return

    case TYPE_PENLINES:
      penLinesReducer(state.penLines, action)
      return

    case TYPE_SELECTION:
      selectionReducer(state.selection, action as SelectionAction,
        state.data?.cells)
      return
  }
}

function makeUndoState(state: PersistentGameState): PersistentGameState {
  return {
    digits: state.digits,
    cornerMarks: state.cornerMarks,
    centreMarks: state.centreMarks,
    colours: state.colours,
    penLines: state.penLines
  }
}

function gameReducer(state: GameState, action: Action) {
  return produce(state, draft => {
    if (action.type === TYPE_INIT) {
      let canonicalData = undefined
      if (action.data !== undefined) {
        canonicalData = { ...action.data }
        canonicalData.cells = canonicalData.cells || []
        canonicalData.regions = canonicalData.regions || []
        canonicalData.cages = canonicalData.cages || []
        canonicalData.lines = canonicalData.lines || []
        canonicalData.arrows = canonicalData.arrows || []
        canonicalData.underlays = canonicalData.underlays || []
        canonicalData.overlays = canonicalData.overlays || []

        // look for additional embedded attributes
        let possibleTitles: string[] = []
        let needToFilterFogLights = false
        for (let cage of canonicalData.cages) {
          if (cage.cells === undefined || !Array.isArray(cage.cells) ||
              cage.cells.length === 0) {
            if (typeof cage.value === "string") {
              if (cage.value.startsWith("title:")) {
                canonicalData.title = canonicalData.title ?? cage.value.substring(6).trim()
              } else if (cage.value.startsWith("author:")) {
                canonicalData.author = canonicalData.author ?? cage.value.substring(7).trim()
              } else if (cage.value.startsWith("rules:")) {
                canonicalData.rules = canonicalData.rules ?? cage.value.substring(6).trim()
              } else if (cage.value.startsWith("foglight:")) {
                let str = cage.value.substring(9).trim()
                canonicalData.fogLights = canonicalData.fogLights ?? parseFogLights(str)
              } else if (cage.value.startsWith("solution:")) {
                let str = cage.value.substring(9).trim()
                canonicalData.solution = canonicalData.solution ?? parseSolution(canonicalData, str)
              } else {
                possibleTitles.push(cage.value)
              }
            }
          } else if (typeof cage.value === "string" && cage.value.toLowerCase() === "foglight") {
            canonicalData.fogLights = canonicalData.fogLights ?? cage.cells.map(c => ({
              center: c,
              size: 1
            }))
            needToFilterFogLights = true
          }
        }
        if (canonicalData.title === undefined && possibleTitles.length > 0) {
          canonicalData.title = possibleTitles[0]
        }
        if (needToFilterFogLights) {
          canonicalData.cages = canonicalData.cages.filter(
            c => typeof c.value !== "string" || c.value.toLowerCase() !== "foglight")
        }
      }

      return makeEmptyState(canonicalData)
    }

    if (action.type !== TYPE_PAUSE && state.paused) {
      // ignore any interaction when paused
      return
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
      draft.errors = checkReducer(draft.digits, draft.data?.cells, draft.data?.solution)
      if (!draft.solved) {
        draft.solved = draft.errors.size === 0
      }
      draft.checkCounter++
      return
    }

    if (action.type === TYPE_PAUSE) {
      draft.paused = !draft.paused
      return
    }

    if ((action.type === TYPE_DIGITS || action.type === TYPE_COLOURS) &&
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

interface ProviderProps {
  children: ReactNode
}

const Provider = ({ children }: ProviderProps) => {
  const [state, dispatch] = useReducer(gameReducer, makeEmptyState())

  return (
    <State.Provider value={state}>
      <Dispatch.Provider value={dispatch}>{children}</Dispatch.Provider>
    </State.Provider>
  )
}

const GameContext = {
  State,
  Dispatch,
  Provider
}

export default GameContext
