import { useGame } from "./hooks/useGame"

const Rules = () => {
  const { title, author, rules } = useGame(state => ({
    title: state.data.title,
    author: state.data.author,
    rules: state.data.rules,
  }))

  return (
    <div className="sidebar-page">
      <h2>{title}</h2>
      {author && <div className="lead">by {author}</div>}
      <p className="whitespace-pre-wrap">{rules}</p>
    </div>
  )
}

export default Rules
