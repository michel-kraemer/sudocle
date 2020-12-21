import Button from "./Button"
import ColourPaletteContext from "./contexts/ColourPaletteContext"
import { TYPE_MODE, TYPE_DIGITS, TYPE_UNDO, TYPE_REDO, ACTION_SET, ACTION_REMOVE } from "./lib/Actions"
import COLOUR_PALETTES from "./lib/ColourPalettes"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "./lib/Modes"
import { useContext } from "react"
import classNames from "classnames"
import styles from "./Pad.scss"

const Pad = ({ updateGame, mode }) => {
  const colourPalette = useContext(ColourPaletteContext.State)
  const colours = COLOUR_PALETTES[colourPalette.palette].colours

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
      <Button active={mode === MODE_NORMAL} onClick={() => onMode(MODE_NORMAL)}>Normal</Button>
      <Button active={mode === MODE_CORNER} onClick={() => onMode(MODE_CORNER)}>Corner</Button>
      <Button active={mode === MODE_CENTRE} onClick={() => onMode(MODE_CENTRE)}>Centre</Button>
      <Button active={mode === MODE_COLOUR} onClick={() => onMode(MODE_COLOUR)}>Colour</Button>
    </div>
    <div className="pad-right">
      {digits.map(d => (
        <Button key={d.digit} noPadding active onClick={() => onDigit(d.digit)}>
          <div className="digit-container">
            <div className={classNames({ centre: mode === MODE_CENTRE,
                corner: mode === MODE_CORNER, [d.corner]: mode === MODE_CORNER,
                colour: mode === MODE_COLOUR })}>
              {mode === MODE_COLOUR || d.digit}
              {mode === MODE_COLOUR && <div className="colour"
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
      <Button>Restart</Button>
      <Button>Check</Button>
    </div>
    <style jsx>{styles}</style>
  </div>
}

export default Pad
