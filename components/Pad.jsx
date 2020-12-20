import Button from "./Button"
import { TYPE_DIGITS, ACTION_SET, ACTION_REMOVE } from "./lib/Actions"
import styles from "./Pad.scss"

const Pad = ({ updateGame }) => {
  function onDigit(digit) {
    updateGame({
      type: TYPE_DIGITS,
      action: ACTION_SET,
      digit
    })
  }

  function onDelete() {
    updateGame({
      type: TYPE_DIGITS,
      action: ACTION_REMOVE
    })
  }

  return <div className="pad">
    <div className="left">
      <Button active>Normal</Button>
      <Button>Corner</Button>
      <Button>Centre</Button>
      <Button>Colour</Button>
    </div>
    <div className="right">
      <Button active onClick={() => onDigit(1)}>1</Button>
      <Button active onClick={() => onDigit(2)}>2</Button>
      <Button active onClick={() => onDigit(3)}>3</Button>
      <Button active onClick={() => onDigit(4)}>4</Button>
      <Button active onClick={() => onDigit(5)}>5</Button>
      <Button active onClick={() => onDigit(6)}>6</Button>
      <Button active onClick={() => onDigit(7)}>7</Button>
      <Button active onClick={() => onDigit(8)}>8</Button>
      <Button active onClick={() => onDigit(9)}>9</Button>
      <div className="delete">
        <Button onClick={onDelete}>Delete</Button>
      </div>
    </div>
    <div className="bottom">
      <Button>Undo</Button>
      <Button>Redo</Button>
      <Button>Restart</Button>
      <Button>Check</Button>
    </div>
    <style jsx>{styles}</style>
  </div>
}

export default Pad
