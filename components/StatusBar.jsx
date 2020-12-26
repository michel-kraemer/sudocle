import Timer from "./Timer"
import { useEffect, useRef } from "react"
import styles from "./StatusBar.scss"

const StatusBar = ({ solved, onHeightChange }) => {
  const ref = useRef()

  useEffect(() => {
    onHeightChange(ref.current.offsetHeight)
  }, [onHeightChange])

  return <div className="status-bar" ref={ref}>
    <Timer solved={solved} />
    <style jsx>{styles}</style>
  </div>
}

export default StatusBar
