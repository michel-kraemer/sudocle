import Button from "./Button"
import { TYPE_MODE, TYPE_DIGITS, ACTION_SET, ACTION_REMOVE } from "./lib/Actions"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "../components/lib/Modes"
import classNames from "classnames"
import styles from "./Pad.scss"

const Pad = ({ updateGame, mode }) => {
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

  const digits = [{
    digit: 1,
    corner: "top-left",
    colour: "#000"
  }, {
    digit: 2,
    corner: "top",
    colour: "#cfcfcf"
  }, {
    digit: 3,
    corner: "top-right",
    colour: "#fff"
  }, {
    digit: 4,
    corner: "left",
    colour: "#a3e048"
  }, {
    digit: 5,
    colour: "#d23be7"
  }, {
    digit: 6,
    corner: "right",
    colour: "#eb7532"
  }, {
    digit: 7,
    corner: "bottom-left",
    colour: "#e6261f"
  }, {
    digit: 8,
    corner: "bottom",
    colour: "#f7d038"
  }, {
    digit: 9,
    corner: "bottom-right",
    colour: "#34bbe6"
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
              {mode === MODE_COLOUR && <div className="colour" style={{ backgroundColor: d.colour }}></div>}
            </div>
          </div>
        </Button>
      ))}
      <div className="delete">
        <Button onClick={onDelete}>Delete</Button>
      </div>
    </div>
    <div className="pad-bottom">
      <Button>Undo</Button>
      <Button>Redo</Button>
      <Button>Restart</Button>
      <Button>Check</Button>
    </div>
    <style jsx>{styles}</style>
  </div>
}

export default Pad
