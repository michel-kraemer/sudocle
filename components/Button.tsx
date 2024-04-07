import clsx from "clsx"
import { MouseEvent, MouseEventHandler, ReactNode, useState } from "react"

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
  function onClickInternal(e: MouseEvent) {
    if (onClick !== undefined) {
      onClick(e)
    }
    e.stopPropagation()
  }

  return (
    <div
      tabIndex={0}
      className={clsx(
        "flex flex-1 text-fg rounded justify-center items-center cursor-pointer select-none leading-4 relative focus:outline-none transition-colors duration-100 ease-linear hover:bg-button-hover hover:active:bg-primary hover:active:text-bg hover:active:transition-none",
        noPadding ? "p-0" : "p-1",
        active
          ? "bg-button-active"
          : pulsating
            ? "[&:not(:hover)]:animate-pulsating"
            : "bg-grey-700"
      )}
      onClick={onClickInternal}
    >
      {children}
    </div>
  )
}

export default Button
