import { useState } from "react"
import classNames from "classnames"
import styles from "./Button.scss"

const Button = ({ active = false, onClick, children }) => {
  const [pressed, setPressed] = useState(false)

  function onClickInternal(e) {
    if (onClick !== undefined) {
      onClick(e)
    }
    e.stopPropagation()
  }

  function onMouseDown() {
    setPressed(true)
  }

  function onMouseUp() {
    setPressed(false)
  }

  return <div className={classNames("button", { active: active || pressed })}
      onClick={onClickInternal} onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
    {children}
    <style jsx>{styles}</style>
  </div>
}

export default Button
