import Timer from "./Timer"
import styles from "./StatusBar.scss"

const StatusBar = ({ solved }) => {
  return <div className="status-bar">
    <Timer solved={solved} />
    <style jsx>{styles}</style>
  </div>
}

export default StatusBar
