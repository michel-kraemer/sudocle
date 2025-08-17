import Button from "./Button"
import { useGame } from "./hooks/useGame"
import { useSettings } from "./hooks/useSettings"
import {
  ACTION_REMOVE,
  ACTION_SET,
  TYPE_CHECK,
  TYPE_COLOURS,
  TYPE_DIGITS,
  TYPE_MODE,
  TYPE_REDO,
  TYPE_UNDO,
} from "./lib/Actions"
import {
  MODE_CENTRE,
  MODE_COLOUR,
  MODE_CORNER,
  MODE_NORMAL,
  MODE_PEN,
  Mode,
  getModeGroup,
} from "./lib/Modes"
import clsx from "clsx"
import Color from "color"
import { Check, Delete, Redo, Undo } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"

interface Colour {
  colour: string
  digit: number
  light: boolean
}

const Placeholder = () => <div className="flex flex-1 bg-grey-700/50 rounded" />

const ModeButton = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[0.5rem] font-condensed">{children}</div>
)

const Pad = () => {
  const ref = useRef<HTMLDivElement>(null)
  const { colourPalette, customColours } = useSettings(
    useShallow(state => ({
      colourPalette: state.colourPalette,
      customColours: state.customColours,
    })),
  )
  const { data, digits, mode, solved } = useGame(
    useShallow(state => ({
      data: state.data,
      digits: state.digits,
      mode: state.mode,
      solved: state.solved,
    })),
  )
  const updateGame = useGame(state => state.updateGame)
  const [colours, setColours] = useState<Colour[]>([])
  const [checkReady, setCheckReady] = useState(false)

  useEffect(() => {
    let computedStyle = getComputedStyle(ref.current!)
    let nColours = +computedStyle.getPropertyValue("--colors")
    let newColours: Colour[] = []
    if (colourPalette !== "custom" || customColours.length === 0) {
      for (let i = 0; i < nColours; ++i) {
        let col = computedStyle.getPropertyValue(`--color-${i + 1}`)
        let pos = +computedStyle.getPropertyValue(`--color-${i + 1}-pos`)
        newColours[pos - 1] = {
          colour: col,
          digit: i + 1,
          light: Color(col.trim()).luminosity() > 0.9,
        }
      }
    } else {
      for (let i = 0; i < customColours.length; ++i) {
        let col = customColours[i]
        newColours[i] = {
          colour: col,
          digit: i + 1,
          light: Color(col.trim()).luminosity() > 0.9,
        }
      }
    }
    setColours(newColours)
  }, [colourPalette, customColours])

  useEffect(() => {
    // check if all cells are filled
    if (data === undefined) {
      setCheckReady(false)
    } else {
      let nCells = data.cells.reduce((acc, v) => acc + v.length, 0)
      setCheckReady(nCells === digits.size)
    }
  }, [data, digits])

  function onDigit(digit: number) {
    updateGame({
      type: TYPE_DIGITS,
      action: ACTION_SET,
      digit,
    })
  }

  function onColour(digit: number) {
    updateGame({
      type: TYPE_COLOURS,
      action: ACTION_SET,
      digit,
    })
  }

  function onMode(mode: Mode) {
    updateGame({
      type: TYPE_MODE,
      action: ACTION_SET,
      mode,
    })
  }

  function onDelete() {
    updateGame({
      type: TYPE_DIGITS,
      action: ACTION_REMOVE,
    })
  }

  function onUndo() {
    updateGame({
      type: TYPE_UNDO,
    })
  }

  function onRedo() {
    updateGame({
      type: TYPE_REDO,
    })
  }

  function onCheck() {
    updateGame({
      type: TYPE_CHECK,
    })
  }

  const digitButtons = []

  let modeGroup = getModeGroup(mode)
  if (modeGroup === 0) {
    if (mode !== MODE_COLOUR) {
      for (let i = 1; i <= 10; ++i) {
        let digit = i % 10
        digitButtons.push(
          <Button key={i} noPadding onClick={() => onDigit(digit)}>
            <div
              className={clsx({
                "text-[1.15rem]": mode === MODE_NORMAL,
                "text-[0.6rem]": mode === MODE_CENTRE,
                [clsx({
                  "text-[0.55rem] absolute": true,
                  "top-[0.2rem] left-[0.4rem]": digit === 0 || digit === 1,
                  "top-[0.2rem]": digit === 2,
                  "top-[0.2rem] right-[0.4rem]": digit === 3,
                  "left-[0.4rem]": digit === 4,
                  "right-[0.4rem]": digit === 6,
                  "bottom-[0.2rem] left-[0.4rem]": digit === 7,
                  "bottom-[0.2rem]": digit === 8,
                  "bottom-[0.2rem] right-[0.4rem]": digit === 9,
                })]: mode === MODE_CORNER,
              })}
            >
              <div>{digit}</div>
            </div>
          </Button>,
        )
      }
    } else if (mode === MODE_COLOUR) {
      for (let c of colours) {
        if (c === undefined) {
          continue
        }
        digitButtons.push(
          <Button key={c.digit} noPadding onClick={() => onColour(c.digit)}>
            <div
              className={clsx("flex flex-1 h-full rounded", {
                "border border-grey-500": c.light,
              })}
              style={{ backgroundColor: c.colour }}
            ></div>
          </Button>,
        )
      }
      while (digitButtons.length < 12) {
        digitButtons.push(<div></div>)
      }
    }
  } else {
    while (digitButtons.length < 12) {
      digitButtons.push(<Placeholder />)
    }
  }

  return (
    <div
      className="grid grid-cols-[repeat(4,2rem)] grid-rows-[repeat(5,2rem)] gap-1 ml-4 lg:ml-12 portrait:ml-0 portrait:mt-4"
      ref={ref}
    >
      <Button noPadding onClick={onDelete}>
        <div className="flex flex-1 items-center justify-center mr-[0.1rem]">
          <Delete size="1.05rem" />
        </div>
      </Button>
      <Button noPadding onClick={onUndo}>
        <Undo size="1.05rem" />
      </Button>
      <Button noPadding onClick={onRedo}>
        <Redo size="1.05rem" />
      </Button>
      {(modeGroup === 0 && (
        <Button
          active={mode === MODE_NORMAL}
          noPadding
          onClick={() => onMode(MODE_NORMAL)}
        >
          <ModeButton>Normal</ModeButton>
        </Button>
      )) || (
        <Button
          active={mode === MODE_PEN}
          noPadding
          onClick={() => onMode(MODE_PEN)}
        >
          <ModeButton>Pen</ModeButton>
        </Button>
      )}
      {digitButtons[0]}
      {digitButtons[1]}
      {digitButtons[2]}
      {(modeGroup === 0 && (
        <Button
          active={mode === MODE_CORNER}
          noPadding
          onClick={() => onMode(MODE_CORNER)}
        >
          <ModeButton>Corner</ModeButton>
        </Button>
      )) || <Placeholder />}
      {digitButtons[3]}
      {digitButtons[4]}
      {digitButtons[5]}
      {(modeGroup === 0 && (
        <Button
          active={mode === MODE_CENTRE}
          noPadding
          onClick={() => onMode(MODE_CENTRE)}
        >
          <ModeButton>Centre</ModeButton>
        </Button>
      )) || <Placeholder />}
      {digitButtons[6]}
      {digitButtons[7]}
      {digitButtons[8]}
      {(modeGroup === 0 && (
        <Button
          active={mode === MODE_COLOUR}
          noPadding
          onClick={() => onMode(MODE_COLOUR)}
        >
          <ModeButton>Colour</ModeButton>
        </Button>
      )) || <Placeholder />}
      {mode !== MODE_COLOUR && (
        <>
          <div className="flex col-span-2">{digitButtons[9]}</div>
          <Placeholder />
        </>
      )}
      {mode === MODE_COLOUR && (
        <>
          {digitButtons[9]}
          {digitButtons[10]}
          {digitButtons[11]}
        </>
      )}
      <Button noPadding onClick={onCheck} pulsating={!solved && checkReady}>
        <Check size="1.05rem" />
      </Button>
    </div>
  )
}

export default Pad
