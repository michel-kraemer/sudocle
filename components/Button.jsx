import classNames from "classnames"
import styles from "./Button.scss"

const Button = ({ active = false, onClick, children }) => {
  function onClickInternal(e) {
    if (onClick !== undefined) {
      onClick(e)
    }
    e.stopPropagation()
  }

  return <div className={classNames("button", { active })} onClick={onClickInternal}>
    {children}
    <style jsx>{styles}</style>
  </div>
}

export default Button
