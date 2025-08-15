import { useGame } from "./hooks/useGame"
import { useShallow } from "zustand/react/shallow"

const Rules = () => {
  const { title, author, rules } = useGame(
    useShallow(state => ({
      title: state.data.title,
      author: state.data.author,
      rules: state.data.rules,
    })),
  )

  return (
    <div className="sidebar-page">
      <h2>{title}</h2>
      {author && <div className="lead">by {author}</div>}
      <p className="whitespace-pre-wrap">{rules}</p>
    </div>
  )
}

export default Rules
