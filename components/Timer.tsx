import { useGame } from "./hooks/useGame"
import { TYPE_PAUSE } from "./lib/Actions"
import { Pause } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface TimerProps {
  solved: boolean
}

const Timer = ({ solved }: TimerProps) => {
  const paused = useGame(state => state.paused)
  const timerOnPause = useGame(state => state.timerOnPause)
  const updateGame = useGame(state => state.updateGame)

  const [start, setStart] = useState(+new Date())
  const [end, setEnd] = useState<number>()
  const [next, setNext] = useState(+new Date())
  const [s, setSeconds] = useState(0)
  const [m, setMinutes] = useState(0)
  const [h, setHours] = useState(0)
  const [pausedElapsed, setPausedElapsed] = useState(0)
  const pauseStart = useRef<number>(undefined)
  const nextTimer = useRef<number>(undefined)
  const lastTimerOnPause = useRef<number>(0)

  if (solved && end === undefined) {
    setEnd(+new Date())
  }

  const onPause = useCallback(() => {
    let now = end ?? +new Date()
    let elapsed = now - start - pausedElapsed
    lastTimerOnPause.current = elapsed
    updateGame({
      type: TYPE_PAUSE,
      timerOnPause: elapsed,
    })
  }, [updateGame, start, end, pausedElapsed])

  useEffect(() => {
    if (solved) {
      // don't react to pause state changes if the puzzle is already solved
      return
    }
    if (paused) {
      pauseStart.current = +new Date()
      if (lastTimerOnPause.current !== timerOnPause) {
        // The timer was not paused using `onPause`. This usually means the
        // `timerOnPause` value comes from a saved game. Reset `start` to
        // simulate that `timerOnPause` milliseconds have already been elapsed.
        setStart(oldStart => oldStart - timerOnPause)
        setPausedElapsed(0)
      }
    } else if (pauseStart.current !== undefined) {
      let elapsed = +new Date() - pauseStart.current
      setPausedElapsed(oldElapsed => oldElapsed + elapsed)
      setNext(+new Date())
    }
  }, [paused, timerOnPause, solved])

  useEffect(() => {
    clearTimeout(nextTimer.current)
    if (paused) {
      return
    }

    let now = end ?? +new Date()
    let elapsed = now - start - pausedElapsed
    let elapsedSeconds = Math.floor(elapsed / 1000)
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

    let timeout = next - now
    let diff = 1000 - ((elapsed % 1000) - 10)
    timeout = Math.min(timeout, diff)

    nextTimer.current = window.setTimeout(() => {
      setNext(next + 1000)
    }, timeout)
  }, [s, m, h, start, end, next, paused, pausedElapsed])

  return (
    <>
      <div className="flex items-center leading-none">
        {h > 0 && <>{("" + h).padStart(2, "0")}:</>}
        {("" + m).padStart(2, "0")}:{("" + s).padStart(2, "0")}
        <div
          className="cursor-pointer pl-0.5 h-3 flex items-center"
          onClick={onPause}
        >
          <Pause
            stroke="none"
            className="[&_rect]:[rx:1] leading-none h-[0.6rem] fill-fg"
          />
        </div>
      </div>
    </>
  )
}

export default Timer
