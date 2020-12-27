import GameContext from "./contexts/GameContext"
import Timer from "./Timer"
import { useContext, useEffect, useRef } from "react"
import styles from "./StatusBar.scss"

const StatusBar = ({ onHeightChange }) => {
  const ref = useRef()
  const game = useContext(GameContext.State)

  useEffect(() => {
    onHeightChange(ref.current.offsetHeight)
  }, [onHeightChange])

  return <div className="status-bar" ref={ref}>
    <Timer solved={game.solved} />
    <style jsx>{styles}</style>
  </div>
}

export default StatusBar
