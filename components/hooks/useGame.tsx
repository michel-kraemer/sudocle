"use client"

import {
  ACTION_ALL,
  ACTION_CLEAR,
  ACTION_DOWN,
  ACTION_LEFT,
  ACTION_PUSH,
  ACTION_REMOVE,
  ACTION_RIGHT,
  ACTION_ROTATE,
  ACTION_SET,
  ACTION_UP,
  Action,
  ColoursAction,
  DigitsAction,
  ModeAction,
  ModeGroupAction,
  PenLinesAction,
  SelectionAction,
  TYPE_CHECK,
  TYPE_COLOURS,
    TYPE_SUDOKURULE,
    TYPE_DIGITS,
  TYPE_INIT,
  TYPE_MODE,
  TYPE_MODE_GROUP,
    TYPE_PAUSE,
    TYPE_PENLINES,
  TYPE_REDO,
  TYPE_SELECTION,
  TYPE_UNDO,
  TYPE_REDO,
  TYPE_INIT,
  TYPE_CHECK,
  TYPE_PAUSE,
    TYPE_SHOWDIGITS, DigitOrSpecialAction, SpecialAction
} from "../lib/Actions"
import {
  MODE_CENTRE,
  MODE_COLOUR,
  MODE_CORNER,
  MODE_NORMAL,
  MODE_PEN,
  Mode,
  getModeGroup,
} from "../lib/Modes"
import parseSolution from "../lib/parsesolution"
import { hasFog, ktoxy, xytok } from "../lib/utils"
import { Data, DataCell, FogLight } from "../types/Data"
import { Digit } from "../types/Game"
import { isEqual, isString } from "lodash"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

const EmptyData: Data = {
  cellSize: 50,
  cells: [],
  regions: [],
  cages: [],
  lines: [],
  arrows: [],
  underlays: [],
  overlays: [],
  solved: false,
}

interface Colour {
  colour: number
}

interface PersistentGameState {
  digits: Map<number, Digit>
  cornerMarks: Map<number, Set<number | string>>
  centreMarks: Map<number, Set<number | string>>
  colours: Map<number, Colour>
  penLines: Set<number>
  fogLights?: FogLight[]
  fogRaster?: number[][]
}

export interface GameState extends PersistentGameState {
  readonly data: Data
  mode: Mode
  modeGroup: number
  enabledModes0: Mode[]
  enabledModes1: Mode[]
  selection: Set<number>
  errors: Set<number>
  undoStates: PersistentGameState[]
  nextUndoState: number
  solved: boolean
  paused: boolean
  checkCounter: number
}

interface GameStateWithActions extends GameState {
  updateGame(action: Action): void
}

function makeGiven<T, R>(
  data: Data | undefined,
  accessor: (cell: DataCell) => T | undefined,
  generator: (value: T) => R,
): Map<number, R> {
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
  return makeGiven(
    data,
    c => c.value,
    n => {
      if (isString(n)) {
        n = /^\d+$/.test(n) ? +n : n
      }
      return {
        digit: n,
        given: true,
        discovered: false,
      }
    },
  )
}

function makeGivenMarks<T extends (string | number)[]>(
  data: Data | undefined,
  accessor: (cell: DataCell) => T | undefined,
): Map<number, Set<string | number>> {
  return makeGiven(data, accessor, cms => {
    let digits = new Set<string | number>()
    for (let cm of cms) {
      let n = isString(cm) && /^\d+$/.test(cm) ? +cm : cm
      digits.add(n)
    }
    return digits
  })
}

/**
 * Calculate all current fog lights: use the static lights from the given data
 * object and add dynamic lights for correct digits.
 */
function makeFogLights(
  data: Data,
  digits: Map<number, Digit>,
): FogLight[] | undefined {
  if (data.fogLights === undefined) {
    // puzzle is not a fog puzzle
    return undefined
  }

  let r: FogLight[] = [...data.fogLights]
  if (data.solution !== undefined) {
    digits.forEach((v, k) => {
      let [x, y] = ktoxy(k)
      let expected = data.solution![y][x]
      if (!v.given && v.digit === expected) {
        r.push({
          center: [y, x],
          size: 3,
        })
      } else if (v.given && v.discovered) {
        r.push({
          center: [y, x],
          size: 1,
        })
      }
    })
  }
  return r
}

function makeFogRaster(
  data: Data,
  fogLights?: FogLight[],
): number[][] | undefined {
  if (fogLights === undefined) {
    return undefined
  }

  let cells: number[][] = Array(data.cells.length)
  for (let i = 0; i < data.cells.length; ++i) {
    cells[i] = Array(data.cells[0].length).fill(1)
  }

  for (let light of fogLights) {
    let y = light.center[0]
    let x = light.center[1]
    if (x < 0 || y < 0) {
      continue
    }
    if (light.size === 3) {
      if (y > 0) {
        if (x > 0) {
          cells[y - 1][x - 1] = 0
        }
        cells[y - 1][x] = 0
        if (x < cells[y - 1].length - 1) {
          cells[y - 1][x + 1] = 0
        }
      }
      cells[y][x - 1] = 0
      cells[y][x] = 0
      cells[y][x + 1] = 0
      if (y < cells.length - 1) {
        if (x > 0) {
          cells[y + 1][x - 1] = 0
        }
        cells[y + 1][x] = 0
        if (x < cells[y + 1].length - 1) {
          cells[y + 1][x + 1] = 0
        }
      }
    } else if (light.size === 1) {
      cells[y][x] = 0
    }
  }

  return cells
}

function parseFogLights(str: string): FogLight[] {
  let result: FogLight[] = []
  if (str === "") {
    return result
  }
  let matches = str.matchAll(/r(-?[0-9]+)c(-?[0-9]+)/gi)
  for (let m of matches) {
    let r = +m[1] - 1
    let c = +m[2] - 1
    if (r >= 0 && c >= 0) {
      result.push({
        center: [r, c],
        size: 1,
      })
    }
  }
  return result
}

function makeEmptyState(data?: Data): GameState {
  let digits = makeGivenDigits(data)
  let fogLights = makeFogLights(data ?? EmptyData, digits)

  return {
    data: data ?? EmptyData,
    mode: MODE_NORMAL,
    modeGroup: 0,
    enabledModes0: [MODE_NORMAL],
    enabledModes1: [MODE_PEN],
    digits,
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
    checkCounter: 0,
    fogLights,
    fogRaster: makeFogRaster(data ?? EmptyData, fogLights),
  }
}

function filterGivens(
  digits: Map<number, Digit>,
  selection: Set<number>,
): Set<number> {
  let r = new Set<number>()
  for (let sc of selection) {
    let cell = digits.get(sc)
    if (cell === undefined || !cell.given || cell.discovered) {
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

function marksReducer(
  marks: Map<number, Set<string | number>>,
  action: DigitOrSpecialAction,
  selection: Set<number>,
  cornerMarks : Map<number, Set<string | number>>,
  centreMarks : Map<number, Set<string | number>>,
  digits : Map<number, Digit>,
) {
  switch (action.action) {
    case ACTION_ALL: {
      let allDigitsInSelection = new Set<string | number>
      for (let sc of selection) {
        // @ts-ignore
        let digitInCurrentCell : string | number | undefined = digits.get(sc)?.digit
        if (digitInCurrentCell !== undefined){
          allDigitsInSelection.add(digitInCurrentCell)
          centreMarks.delete(sc)
          cornerMarks.delete(sc)
        }
        else {
          let centreMarksInCurrentCell = centreMarks.get(sc)
          if (centreMarksInCurrentCell === undefined){
            centreMarksInCurrentCell = new Set()
            centreMarks.set(sc, centreMarksInCurrentCell)
            for (let counter = 1; counter <= 9; counter++){
              centreMarksInCurrentCell.add(counter)
            }
          }
        }
      }
      if (allDigitsInSelection.size !== 0){
        for (let sc2 of selection){
          let cornerMarksInCurrentCell = cornerMarks.get(sc2)
          if (cornerMarksInCurrentCell !== undefined){
            for (let digitToRemove of allDigitsInSelection){
              if (cornerMarksInCurrentCell.has(digitToRemove)){
                cornerMarksInCurrentCell.delete(digitToRemove)
              }
            }
          }
          let centreMarksInCurrentCell = centreMarks.get(sc2)
          if (centreMarksInCurrentCell !== undefined){
            for (let digitToRemove of allDigitsInSelection){
              if (centreMarksInCurrentCell.has(digitToRemove)){
                centreMarksInCurrentCell.delete(digitToRemove)
              }
              if (centreMarksInCurrentCell.size === 1){
                let digitToPlace = 0
                for (let counter = 1; counter <= 9; counter++){
                  if (centreMarksInCurrentCell.has(counter)){
                    digitToPlace = counter
                    break
                  }
                }
                let attrName = "digit"
                digits.set(sc2, {
                  digit: digitToPlace,
                  given: false,
                  discovered: true
                })
              }
            }
          }
        }
      }
      break
    }

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

function digitsReducer(
  digits: Map<number, Digit>,
  action: DigitsAction,
  selection: Set<number>,
): boolean {
  let changed = false

  switch (action.action) {
    case ACTION_SET: {
      if (action.digit !== undefined) {
        for (let sc of selection) {
          let oldDigit = digits.get(sc)
          if (oldDigit !== undefined && oldDigit.given) {
            if (oldDigit.digit === action.digit) {
              digits.set(sc, {
                digit: action.digit,
                given: true,
                discovered: true,
              })
              changed = true
            }
          } else {
            digits.set(sc, {
              digit: action.digit,
              given: false,
              discovered: false,
            })
            changed = true
          }
        }
      }
      break
    }

    case ACTION_REMOVE: {
      for (let sc of selection) {
        let oldDigit = digits.get(sc)
        if (oldDigit !== undefined && oldDigit.given) {
          digits.set(sc, {
            digit: oldDigit.digit,
            given: true,
            discovered: false,
          })
          changed = true
        } else {
          if (digits.delete(sc)) {
            changed = true
          }
        }
      }
      break
    }
  }

  return changed
}

function coloursReducer(
  colours: Map<number, Colour>,
  action: ColoursAction,
  selection: Iterable<number>,
) {
  switch (action.action) {
    case ACTION_SET: {
      if (action.digit !== undefined) {
        for (let sc of selection) {
          colours.set(sc, {
            colour: action.digit,
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

function selectionReducer(
  selection: Set<number>,
  action: SelectionAction | SpecialAction,
  cells: DataCell[][] = [],
  rowNumber : number | undefined = undefined,
  columnNumber : number | undefined = undefined,
  centreMarks : Map<number, Set<string | number>> | undefined = undefined,
  digits : Map<number, Digit> | undefined = undefined){
  switch (action.action) {
    case ACTION_ALL:
      if (rowNumber === undefined && columnNumber === undefined && centreMarks === undefined){
        selection.clear()
        cells.forEach((row, y) => {
          row.forEach((col, x) => {
            selection.add(xytok(x, y))
          })
        })
        return
      }
      // if centreMarks were passed, mark all cells that contain the action's digit as pencilmark
      else if (centreMarks !== undefined && digits !== undefined){
        selection.clear()
        cells.forEach((row, y) => {
          row.forEach((col, x) => {
            let currentCentreMarks = centreMarks.get(xytok(x, y))
            let currentMarks = digits.get(xytok(x, y))
            // @ts-ignore
            if (currentMarks === undefined && currentCentreMarks !== undefined && currentCentreMarks.has(action.digit)){
              selection.add(xytok(x, y))
            }
          })
        })
        return
      }
      else {
        // select 3x3 cages
        // rowCounter then denominates the vertical enumeration of the cage and columnCounter the horizontal one
        // e.g. 0,0 denotes the upper left cage, 1,1 denotes the middle cage and 1,3 denotes the rightmost cage in the middle
        if (rowNumber !== undefined && columnNumber !== undefined){
          rowNumber *=3
          columnNumber *= 3
          selection.clear()
          cells.forEach((row, y) => {
            row.forEach((col, x) => {
              // @ts-ignore
              if (y >= rowNumber && y <= rowNumber+2 && x >= columnNumber && x <= columnNumber+2)
                selection.add(xytok(x, y))
            })
          })
          return
        }
        // select rows
        else if (rowNumber !== undefined){
          selection.clear()
          cells.forEach((row, y) => {
            selection.add(xytok(y, rowNumber!))
          })
          return
        }
        // select columns
        else if (columnNumber !== undefined){
          selection.clear()
          cells.forEach((col, y) => {
            selection.add(xytok(columnNumber!, y))
          })
          return
        }
      }
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

  if (
    selection.size > 0 &&
    (action.action === ACTION_RIGHT ||
      action.action === ACTION_LEFT ||
      action.action === ACTION_UP ||
      action.action === ACTION_DOWN)
  ) {
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

function checkDuplicates(
  grid: (string | number)[][],
  errors: Set<number>,
  flip = false,
) {
  for (let y = 0; y < grid.length; ++y) {
    let cells = grid[y]
    if (cells !== undefined) {
      for (let x = 0; x < cells.length; ++x) {
        for (let x2 = x + 1; x2 < cells.length; ++x2) {
          if (
            cells[x] !== undefined &&
            cells[x2] !== undefined &&
            cells[x] === cells[x2]
          ) {
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

function checkReducer(
  digits: Map<number, Digit>,
  cells: DataCell[][] = [],
  solution?: (number | undefined)[][],
): Set<number> {
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
    case TYPE_SHOWDIGITS:
      selectionReducer(state.selection, action, state.data?.cells, undefined, undefined, state.centreMarks, state.digits)
      return
    case TYPE_SUDOKURULE:
      // Remove corner and centre marks in cages where the respective digit exists
      for (let rowCounter = 0; rowCounter <= 2; rowCounter++){
        for (let columnCounter = 0; columnCounter <= 2; columnCounter++){
          selectionReducer(state.selection, action, state.data?.cells, rowCounter, columnCounter)
          marksReducer(state.cornerMarks, action, state.selection, state.cornerMarks, state.centreMarks, state.digits)
        }
      }

      // Remove corner and centre marks in rows / columns when the respective digit exists in that row / column
      for (let counter = 0; counter <= 8; counter++){
        selectionReducer(state.selection, action, state.data?.cells, undefined, counter)
        marksReducer(state.cornerMarks, action, state.selection, state.cornerMarks, state.centreMarks, state.digits)
        selectionReducer(state.selection, action, state.data?.cells, counter, undefined)
        marksReducer(state.cornerMarks, action, state.selection, state.cornerMarks, state.centreMarks, state.digits)
      }
      state.selection.clear()
      return
    case TYPE_MODE:
      modeReducer(state, action)
      return

    case TYPE_MODE_GROUP:
      modeGroupReducer(state, action)
      return

    case TYPE_DIGITS: {
      let filteredDigits: Map<number, Digit>
      if (state.data.fogLights !== undefined) {
        // ignore given digits covered by fog
        filteredDigits = new Map<number, Digit>()
        state.digits.forEach((v, k) => {
          let [x, y] = ktoxy(k)
          if (!v.given || !hasFog(state.fogRaster, x, y)) {
            filteredDigits.set(k, v)
          }
        })
      } else {
        // puzzle is not a fog puzzle - use all digits
        filteredDigits = state.digits
      }

      switch (mode) {
        case MODE_CORNER:
          marksReducer(
            state.cornerMarks,
            action,
            filterGivens(filteredDigits, state.selection),
            state.cornerMarks,
            state.centreMarks,
            state.digits
          )
          return
        case MODE_CENTRE:
          marksReducer(
            state.centreMarks,
            action,
            filterGivens(filteredDigits, state.selection),
              state.cornerMarks,
              state.centreMarks,
              state.digits
          )
          return
      }

      let changed = digitsReducer(
        state.digits,
        action,
        filterGivens(filteredDigits, state.selection),
      )

      if (changed && state.data.fogLights !== undefined) {
        // update fog lights after digits have changed
        state.fogLights = makeFogLights(state.data, state.digits)
        state.fogRaster = makeFogRaster(state.data, state.fogLights)
      }

      return
    }

    case TYPE_COLOURS:
      coloursReducer(state.colours, action, state.selection)
      return

    case TYPE_PENLINES:
      penLinesReducer(state.penLines, action)
      return

    case TYPE_SELECTION:
      selectionReducer(
        state.selection,
        action as SelectionAction,
        state.data?.cells,
      )
      return
  }
}

function makeUndoState(state: PersistentGameState): PersistentGameState {
  return {
    digits: state.digits,
    cornerMarks: state.cornerMarks,
    centreMarks: state.centreMarks,
    colours: state.colours,
    penLines: state.penLines,
    fogLights: state.fogLights,
    fogRaster: state.fogRaster,
  }
}

export const useGame = create<GameStateWithActions>()(
  immer((set, get) => ({
    ...makeEmptyState(),

    updateGame: (action: Action) =>
      set(draft => {
        if (action.type === TYPE_INIT) {
          let canonicalData:
            | {
                -readonly [P in keyof Data]: Data[P]
              }
            | undefined = undefined
          if (action.data !== undefined) {
            // Filter out invalid elements. For the time being, these are only
            // lines without colour or waypoints. In the future, we might
            // implement more rules or check the schema against our data model.
            let data = { ...action.data }
            if (
              data.lines !== undefined &&
              Array.isArray(data.lines) &&
              data.lines.some(
                (l: any) => l.color === undefined || l.wayPoints === undefined,
              )
            ) {
              data.lines = data.lines.filter(
                (l: any) => l.color !== undefined && l.wayPoints !== undefined,
              )
            }
            if (
              data.gridLines !== undefined &&
              Array.isArray(data.gridLines) &&
              data.gridLines.some(
                (l: any) => l.color === undefined || l.wayPoints === undefined,
              )
            ) {
              data.gridLines = data.gridLines.filter(
                (l: any) => l.color !== undefined && l.wayPoints !== undefined,
              )
            }

            canonicalData = data as Data
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
              if (typeof cage.value === "string") {
                if (cage.value.startsWith("title:")) {
                  canonicalData.title =
                    canonicalData.title ?? cage.value.substring(6).trim()
                } else if (cage.value.startsWith("author:")) {
                  canonicalData.author =
                    canonicalData.author ?? cage.value.substring(7).trim()
                } else if (cage.value.startsWith("rules:")) {
                  canonicalData.rules =
                    canonicalData.rules ?? cage.value.substring(6).trim()
                } else if (cage.value.startsWith("foglight:")) {
                  let str = cage.value.substring(9).trim()
                  canonicalData.fogLights = [
                    ...(canonicalData.fogLights ?? []),
                    ...parseFogLights(str),
                  ]
                } else if (cage.value.startsWith("solution:")) {
                  let str = cage.value.substring(9).trim()
                  canonicalData.solution =
                    canonicalData.solution ??
                    parseSolution(canonicalData.cells, str)
                } else if (cage.value.startsWith("msgcorrect:")) {
                  // Message to be displayed if solution is correct. This is not
                  // implemented yet. Ignore it.
                } else if (cage.value.toLowerCase() === "foglight") {
                  canonicalData.fogLights = [
                    ...(canonicalData.fogLights ?? []),
                    ...(cage.cells ?? []).map<FogLight>(c => ({
                      center: c,
                      size: 1,
                    })),
                  ]
                  needToFilterFogLights = true
                } else {
                  possibleTitles.push(cage.value)
                }
              }
            }
            if (
              canonicalData.title === undefined &&
              possibleTitles.length > 0
            ) {
              canonicalData.title = possibleTitles[0]
            }
            if (needToFilterFogLights) {
              canonicalData.cages = canonicalData.cages.filter(
                c =>
                  typeof c.value !== "string" ||
                  c.value.toLowerCase() !== "foglight",
              )
            }
            if (canonicalData.rules !== undefined) {
              // fix invalid line breaks in rules
              canonicalData.rules = canonicalData.rules.replaceAll(/\\n/g, "\n")
            }
          }

          return makeEmptyState(canonicalData)
        }

        if (action.type !== TYPE_PAUSE && draft.paused) {
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
          draft.errors = checkReducer(
            draft.digits,
            draft.data?.cells,
            draft.data?.solution,
          )
          draft.solved = draft.errors.size === 0
          draft.checkCounter++
          return
        }

        if (action.type === TYPE_PAUSE) {
          draft.paused = !draft.paused
          return
        }

        if (
          (action.type === TYPE_DIGITS || action.type === TYPE_COLOURS) &&
          action.action === ACTION_REMOVE
        ) {
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
              if (digit !== undefined && (!digit.given || digit.discovered)) {
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

        let us = makeUndoState(get())
        let nus = makeUndoState(draft)
        if (
          !isEqual(us, nus) &&
          (draft.nextUndoState === 0 ||
            !isEqual(draft.undoStates[draft.nextUndoState - 1], us))
        ) {
          let newUndoStates = draft.undoStates.slice(0, draft.nextUndoState)
          newUndoStates[draft.nextUndoState] = us
          draft.undoStates = newUndoStates
          draft.nextUndoState = draft.nextUndoState + 1
        }
      }),
  })),
)
