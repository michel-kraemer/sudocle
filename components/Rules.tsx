import { State as GameContextState } from "./contexts/GameContext"
import { useContext } from "react"

const Rules = () => {
  const game = useContext(GameContextState)

  return (
    <div className="sidebar-page">
      <h2>{game.data.title}</h2>
      {game.data.author && <div className="lead">by {game.data.author}</div>}
      <p className="whitespace-pre-wrap">{game.data.rules}</p>
    </div>
  )
}

export default Rules
