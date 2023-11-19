import Button from "./Button"
import {
  Dispatch as GameContextDispatch,
  State as GameContextState
} from "./contexts/GameContext"
import { TYPE_PAUSE } from "./lib/Actions"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { Pause } from "lucide-react"
import styles from "./Timer.oscss"

interface TimerProps {
  solved: boolean
}

const Timer = ({ solved }: TimerProps) => {
  const game = useContext(GameContextState)
  const updateGame = useContext(GameContextDispatch)

  const [start] = useState(+new Date())
  const [end, setEnd] = useState<number>()
  const [next, setNext] = useState(+new Date())
  const [s, setSeconds] = useState(0)
  const [m, setMinutes] = useState(0)
  const [h, setHours] = useState(0)
  const [continueVisible, setContinueVisible] = useState(false)
  const [pauseStart, setPauseStart] = useState<number>()
  const [pausedElapsed, setPausedElapsed] = useState(0)
  const nextTimer = useRef<number>()

  if (solved && end === undefined) {
    setEnd(+new Date())
  }

  const onPause = useCallback(() => {
    if (game.paused) {
      let nextRemaining = next - pauseStart!
      setNext(+new Date() - (1000 - nextRemaining))
      let elapsed = +new Date() - pauseStart!
      setPausedElapsed(oldElapsed => oldElapsed + elapsed)
      setNext(+new Date())
      updateGame({
        type: TYPE_PAUSE
      })
    } else {
      updateGame({
        type: TYPE_PAUSE
      })
      setContinueVisible(true)
      setPauseStart(+new Date())
    }
  }, [game.paused, next, pauseStart, updateGame])

  function onContinue() {
    setContinueVisible(false)
    onPause()
  }

  useEffect(() => {
    clearTimeout(nextTimer.current)
    if (game.paused) {
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

    nextTimer.current = window.setTimeout(() => {
      setNext(next + 1000)
    }, next - now)
  }, [s, m, h, start, end, next, game.paused, pausedElapsed])

  return (
    <>
      <div className="timer">
        {h > 0 && <>{("" + h).padStart(2, "0")}:</>}
        {("" + m).padStart(2, "0")}:{("" + s).padStart(2, "0")}
        <div className="pause-button" onClick={onPause}>
          <Pause />
        </div>
      </div>
      {continueVisible && (
        <div className="timer-pause-overlay">
          <div className="continue-area">
            <div className="title">
              <Pause size="1.5em" /> Game paused
            </div>
            <div className="button-area">
              <Button onClick={onContinue}>Continue</Button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{styles}</style>
    </>
  )
}

export default Timer
