import { State as GameContextState } from "./contexts/GameContext"
import { useContext } from "react"
import styles from "./Rules.oscss"

const Rules = () => {
  const game = useContext(GameContextState)

  return (
    <div className="sidebar-page">
      <h2>{game.data.title}</h2>
      {game.data.author && <div className="author">by {game.data.author}</div>}
      <p className="rules">{game.data.rules}</p>
      <style jsx>{styles}</style>
    </div>
  )
}

export default Rules
