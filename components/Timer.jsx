import { useEffect, useState } from "react"

const Timer = ({ solved }) => {
  const [start] = useState(+new Date())
  const [end, setEnd] = useState()
  const [next, setNext] = useState(+new Date())
  const [s, setSeconds] = useState(0)
  const [m, setMinutes] = useState(0)
  const [h, setHours] = useState(0)

  if (solved && end === undefined) {
    setEnd(+new Date())
  }

  useEffect(() => {
    let now = end || +new Date()
    let elapsedSeconds = Math.floor((now - start) / 1000)
    let news = elapsedSeconds % 60
    if (news !== s) {
      setSeconds(news)
    }
    let newm = Math.floor((elapsedSeconds / 60) % 60)
    if (newm !== m) {
      setMinutes(newm)
    }
    let newh = Math.floor(elapsedSeconds / 60 / 60)
    if (newh !== h) {
      setHours(newh)
    }

    setTimeout(() => {
      setNext(next + 1000)
    }, next - now)
  }, [s, m, h, start, end, next])

  return <div className="timer">{h > 0 && <>{("" + h).padStart(2, "0")}:</>}{("" + m).padStart(2, "0")}:{("" + s).padStart(2, "0")}</div>
}

export default Timer
