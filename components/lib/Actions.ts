import { Data } from "../types/Data"
import { Mode } from "./Modes"

export const TYPE_MODE = "mode"
export const TYPE_MODE_GROUP = "modeGroup"
export const TYPE_DIGITS = "digits"
export const TYPE_CORNER_MARKS = "cornerMarks"
export const TYPE_CENTRE_MARKS = "centreMarks"
export const TYPE_COLOURS = "colours"
export const TYPE_PENLINES = "penLines"
export const TYPE_SELECTION = "selection"
export const TYPE_UNDO = "undo"
export const TYPE_REDO = "redo"
export const TYPE_INIT = "init"
export const TYPE_CHECK = "check"
export const TYPE_PAUSE = "pause"
export const TYPE_SUDOKURULE = "rule"
export const TYPE_SHOWDIGITS = "showdigits"

export const ACTION_ALL = "all"
export const ACTION_SET = "set"
export const ACTION_PUSH = "push"
export const ACTION_CLEAR = "clear"
export const ACTION_REMOVE = "remove"
export const ACTION_ROTATE = "rotate"
export const ACTION_RIGHT = "right"
export const ACTION_LEFT = "left"
export const ACTION_UP = "up"
export const ACTION_DOWN = "down"

export interface ModeAction {
  readonly type: typeof TYPE_MODE
  readonly action:
    | typeof ACTION_SET
    | typeof ACTION_PUSH
    | typeof ACTION_REMOVE
    | typeof ACTION_ROTATE
  readonly mode?: Mode
}

export interface ModeGroupAction {
  readonly type: typeof TYPE_MODE_GROUP
  readonly action: typeof ACTION_ROTATE
}

export interface DigitsAction {
  readonly type: typeof TYPE_DIGITS
  readonly action: typeof ACTION_SET | typeof ACTION_REMOVE
  readonly digit?: number
}

export interface ColoursAction {
  readonly type: typeof TYPE_COLOURS
  readonly action: typeof ACTION_SET | typeof ACTION_REMOVE | typeof ACTION_ALL
  readonly digit?: number
}

export interface PenLinesAction {
  readonly type: typeof TYPE_PENLINES
  readonly action: typeof ACTION_PUSH | typeof ACTION_REMOVE
  readonly k: number | number[]
}

export interface SelectionAction {
  readonly type: typeof TYPE_SELECTION
  readonly action:
    | typeof ACTION_ALL
    | typeof ACTION_CLEAR
    | typeof ACTION_SET
    | typeof ACTION_PUSH
    | typeof ACTION_REMOVE
    | typeof ACTION_RIGHT
    | typeof ACTION_LEFT
    | typeof ACTION_UP
    | typeof ACTION_DOWN
  readonly k?: number | number[]
  readonly append?: boolean
  readonly digit?: number | string | undefined
}

export interface UndoAction {
  readonly type: typeof TYPE_UNDO
}

export interface RedoAction {
  readonly type: typeof TYPE_REDO
}

export interface InitAction {
  readonly type: typeof TYPE_INIT
  readonly data?: any
}

export interface CheckAction {
  readonly type: typeof TYPE_CHECK
}

export interface PauseAction {
  readonly type: typeof TYPE_PAUSE
}

export interface SpecialAction {
  readonly type:
      | typeof TYPE_SUDOKURULE
      | typeof TYPE_SHOWDIGITS
  readonly action: typeof ACTION_ALL
  readonly digit?: number | string | undefined
}

export type DigitOrSpecialAction =
    | DigitsAction
    | SpecialAction

export type Action =
  | ModeAction
  | ModeGroupAction
  | DigitsAction
  | ColoursAction
  | PenLinesAction
  | SelectionAction
  | UndoAction
  | RedoAction
  | InitAction
  | CheckAction
  | PauseAction
  | SpecialAction
