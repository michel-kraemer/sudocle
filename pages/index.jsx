import Grid from "../components/Grid"
import styles from "./index.scss"

const Index = () => {
  return <div className="game-container">
    <div className="grid-container">
      <Grid />
    </div>
    <style jsx>{styles}</style>
  </div>
}

export default Index
