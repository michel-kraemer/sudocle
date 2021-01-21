import Button from "./Button"
import SettingsContext from "./contexts/SettingsContext"
import GameContext from "./contexts/GameContext"
import { TYPE_MODE, TYPE_DIGITS, TYPE_UNDO, TYPE_REDO, TYPE_RESTART, TYPE_CHECK,
  ACTION_SET, ACTION_REMOVE } from "./lib/Actions"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "./lib/Modes"
import { useContext, useEffect, useRef, useReducer, useState } from "react"
import classNames from "classnames"
import styles from "./Pad.scss"

const Pad = () => {
  const ref = useRef()
  const settings = useContext(SettingsContext.State)
  const game = useContext(GameContext.State)
  const updateGame = useContext(GameContext.Dispatch)
  const [colours, setColours] = useState([])

  const confirmRestartSetTime = useRef(+new Date())
  const confirmRestartTimer = useRef()
  const [confirmRestart, setConfirmRestart] = useReducer((_, v) => {
    confirmRestartSetTime.current = +new Date()

    // clear old timer
    if (confirmRestartTimer.current !== undefined) {
      clearTimeout(confirmRestartTimer.current)
      confirmRestartTimer.current = undefined
    }

    // automatically reset flag after 5 seconds
    if (v) {
      confirmRestartTimer.current = setTimeout(() => {
        setConfirmRestart(false)
      }, 5000)
    }

    return v
  }, false)

  useEffect(() => {
    let computedStyle = getComputedStyle(ref.current)
    let nColours = +computedStyle.getPropertyValue("--colors")
    let newColours = []
    if (settings.colourPalette !== "custom") {
      for (let i = 0; i < nColours; ++i) {
        let pos = +computedStyle.getPropertyValue(`--color-${i + 1}-pos`)
        newColours[pos - 1] = {
          colour: computedStyle.getPropertyValue(`--color-${i + 1}`),
          digit: i + 1
        }
      }
    } else {
      for (let i = 0; i < settings.customColours.length; ++i) {
        newColours[i] = {
          colour: settings.customColours[i],
          digit: i + 1
        }
      }
    }
    setColours(newColours)
  }, [settings.colourPalette, settings.customColours])

  function onDigit(digit) {
    updateGame({
      type: TYPE_DIGITS,
      action: ACTION_SET,
      digit
    })
  }

  function onMode(mode) {
    updateGame({
      type: TYPE_MODE,
      action: ACTION_SET,
      mode
    })
  }

  function onDelete() {
    updateGame({
      type: TYPE_DIGITS,
      action: ACTION_REMOVE
    })
  }

  function onUndo() {
    updateGame({
      type: TYPE_UNDO
    })
  }

  function onRedo() {
    updateGame({
      type: TYPE_REDO
    })
  }

  function onRestart() {
    if (!confirmRestart) {
      setConfirmRestart(true)
    } else {
      // prevent accidental double click
      if (new Date() - confirmRestartSetTime.current > 200) {
        updateGame({
          type: TYPE_RESTART
        })
        setConfirmRestart(false)
      }
    }
  }

  function onRestartBlur() {
    setConfirmRestart(false)
  }

  function onCheck() {
    updateGame({
      type: TYPE_CHECK
    })
  }

  const digits = [{
    digit: 1,
    corner: "top-left"
  }, {
    digit: 2,
    corner: "top"
  }, {
    digit: 3,
    corner: "top-right"
  }, {
    digit: 4,
    corner: "left"
  }, {
    digit: 5
  }, {
    digit: 6,
    corner: "right"
  }, {
    digit: 7,
    corner: "bottom-left"
  }, {
    digit: 8,
    corner: "bottom"
  }, {
    digit: 9,
    corner: "bottom-right"
  }]

  let extended = game.mode === MODE_COLOUR && colours.length > 9

  return <div className="pad" ref={ref}>
    <div className="pad-left">
      <Button active={game.mode === MODE_NORMAL} onClick={() => onMode(MODE_NORMAL)}>Normal</Button>
      <Button active={game.mode === MODE_CORNER} onClick={() => onMode(MODE_CORNER)}>Corner</Button>
      <Button active={game.mode === MODE_CENTRE} onClick={() => onMode(MODE_CENTRE)}>Centre</Button>
      <Button active={game.mode === MODE_COLOUR} onClick={() => onMode(MODE_COLOUR)}>Colour</Button>
    </div>
    <div className={classNames("pad-right", { extended })}>
      {game.mode !== MODE_COLOUR && (digits.map(d => (
        <Button key={d.digit} noPadding active onClick={() => onDigit(d.digit)}>
          <div className="digit-container">
            <div className={classNames({ centre: game.mode === MODE_CENTRE,
                corner: game.mode === MODE_CORNER, [d.corner]: game.mode === MODE_CORNER })}>
              {d.digit}
            </div>
          </div>
        </Button>
      )))}
      {game.mode === MODE_COLOUR && (colours.map((c, i) => (
        <Button key={i} noPadding active onClick={() => onDigit(c.digit)}>
          <div className="digit-container">
            <div className={classNames("colour", { extended })}>
              <div className="colour" style={{ backgroundColor: c.colour }}></div>
            </div>
          </div>
        </Button>
      )))}
      <div className={classNames("delete", { extended })}>
        <Button onClick={onDelete}>Delete</Button>
      </div>
    </div>
    <div className="pad-bottom">
      <Button onClick={onUndo}>Undo</Button>
      <Button onClick={onRedo}>Redo</Button>
      <Button onClick={onRestart} alert={confirmRestart} onBlur={onRestartBlur}>
        {confirmRestart ? "Confirm?" : "Restart"}
      </Button>
      <Button onClick={onCheck}>Check</Button>
    </div>
    <style jsx>{styles}</style>
  </div>
}

export default Pad
