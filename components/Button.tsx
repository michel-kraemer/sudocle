import { MouseEvent, MouseEventHandler, ReactNode, useState } from "react"
import classNames from "classnames"
import styles from "./Button.oscss"

interface ButtonProps {
  active?: boolean
  onClick: MouseEventHandler
  noPadding?: boolean
  pulsating?: boolean
  children: ReactNode
}

const Button = ({
  active = false,
  onClick,
  noPadding = false,
  pulsating = false,
  children
}: ButtonProps) => {
  const [pressed, setPressed] = useState(false)

  function onClickInternal(e: MouseEvent) {
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

  return (
    <div
      tabIndex={0}
      className={classNames("button", {
        active,
        pressed,
        "no-padding": noPadding,
        pulsating
      })}
      onClick={onClickInternal}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {children}
      <style jsx>{styles}</style>
    </div>
  )
}

export default Button
