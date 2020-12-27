import Button from "./Button"
import ColourPaletteContext from "./contexts/ColourPaletteContext"
import GameContext from "./contexts/GameContext"
import { TYPE_MODE, TYPE_DIGITS, TYPE_UNDO, TYPE_REDO, TYPE_RESTART, TYPE_CHECK,
  ACTION_SET, ACTION_REMOVE } from "./lib/Actions"
import COLOUR_PALETTES from "./lib/ColourPalettes"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "./lib/Modes"
import { useContext, useState } from "react"
import classNames from "classnames"
import styles from "./Pad.scss"

const Pad = () => {
  const colourPalette = useContext(ColourPaletteContext.State)
  const game = useContext(GameContext.State)
  const updateGame = useContext(GameContext.Dispatch)
  const colours = COLOUR_PALETTES[colourPalette.palette].colours

  const [confirmRestart, setConfirmRestart] = useState(false)

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
      updateGame({
        type: TYPE_RESTART
      })
      setConfirmRestart(false)
    }
  }

  function onCheck() {
    updateGame({
      type: TYPE_CHECK
    })
  }

  const digits = [{
    digit: 1,
    corner: "top-left",
    colour: 0
  }, {
    digit: 2,
    corner: "top",
    colour: 1
  }, {
    digit: 3,
    corner: "top-right",
    colour: 2
  }, {
    digit: 4,
    corner: "left",
    colour: 3
  }, {
    digit: 5,
    colour: 4
  }, {
    digit: 6,
    corner: "right",
    colour: 5
  }, {
    digit: 7,
    corner: "bottom-left",
    colour: 6
  }, {
    digit: 8,
    corner: "bottom",
    colour: 7
  }, {
    digit: 9,
    corner: "bottom-right",
    colour: 8
  }]

  return <div className="pad">
    <div className="pad-left">
      <Button active={game.mode === MODE_NORMAL} onClick={() => onMode(MODE_NORMAL)}>Normal</Button>
      <Button active={game.mode === MODE_CORNER} onClick={() => onMode(MODE_CORNER)}>Corner</Button>
      <Button active={game.mode === MODE_CENTRE} onClick={() => onMode(MODE_CENTRE)}>Centre</Button>
      <Button active={game.mode === MODE_COLOUR} onClick={() => onMode(MODE_COLOUR)}>Colour</Button>
    </div>
    <div className="pad-right">
      {digits.map(d => (
        <Button key={d.digit} noPadding active onClick={() => onDigit(d.digit)}>
          <div className="digit-container">
            <div className={classNames({ centre: game.mode === MODE_CENTRE,
                corner: game.mode === MODE_CORNER, [d.corner]: game.mode === MODE_CORNER,
                colour: game.mode === MODE_COLOUR })}>
              {game.mode === MODE_COLOUR || d.digit}
              {game.mode === MODE_COLOUR && <div className="colour"
                style={{ backgroundColor: colours[d.colour] }}></div>}
            </div>
          </div>
        </Button>
      ))}
      <div className="delete">
        <Button onClick={onDelete}>Delete</Button>
      </div>
    </div>
    <div className="pad-bottom">
      <Button onClick={onUndo}>Undo</Button>
      <Button onClick={onRedo}>Redo</Button>
      <Button onClick={onRestart} alert={confirmRestart}>
        {confirmRestart ? "Confirm?" : "Restart"}
      </Button>
      <Button onClick={onCheck}>Check</Button>
    </div>
    <style jsx>{styles}</style>
  </div>
}

export default Pad
