import Timer from "./Timer"
import styles from "./StatusBar.scss"

const StatusBar = () => {
  return <div className="status-bar">
    <Timer />
    <style jsx>{styles}</style>
  </div>
}

export default StatusBar
