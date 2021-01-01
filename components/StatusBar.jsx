import GameContext from "./contexts/GameContext"
import Timer from "./Timer"
import { useContext } from "react"
import styles from "./StatusBar.scss"

const StatusBar = () => {
  const game = useContext(GameContext.State)

  return <div className="status-bar">
    <Timer solved={game.solved} />
    <style jsx>{styles}</style>
  </div>
}

export default StatusBar
