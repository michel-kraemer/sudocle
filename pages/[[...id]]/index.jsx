import GameContext from "../../components/contexts/GameContext"
import SettingsContext from "../../components/contexts/SettingsContext"
import Grid from "../../components/Grid"
import Pad from "../../components/Pad"
import Sidebar from "../../components/Sidebar"
import StatusBar from "../../components/StatusBar"
import { TYPE_MODE, TYPE_SELECTION, TYPE_UNDO, TYPE_REDO, TYPE_RESTART,
  ACTION_SET, ACTION_PUSH, ACTION_CLEAR, ACTION_REMOVE, ACTION_ROTATE,
  ACTION_RIGHT, ACTION_LEFT, ACTION_UP, ACTION_DOWN } from "../../components/lib/Actions"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "../../components/lib/Modes"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import Head from "next/head"
import styles from "./index.scss"

const DATABASE_URL = "https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/{}?alt=media"
const STATUS_BAR_GAP = 10 // minimum gap between status bar and grid

const Index = () => {
  const game = useContext(GameContext.State)
  const updateGame = useContext(GameContext.Dispatch)
  const settings = useContext(SettingsContext.State)
  const gameContainerRef = useRef()
  const padContainerRef = useRef()
  const [gridMaxWidth, setGridMaxWidth] = useState(0)
  const [gridMaxHeight, setGridMaxHeight] = useState(0)
  const [portrait, setPortrait] = useState(false)
  const [statusBarHeight, setStatusBarHeight] = useState(0)
  const [rendering, setRendering] = useState(true)

  function onStatusBarHeightChange(newHeight) {
    setStatusBarHeight(newHeight)
  }

  function clearSelection() {
    updateGame({
      type: TYPE_SELECTION,
      action: ACTION_CLEAR
    })
  }

  const onFinishRender = useCallback(() => setRendering(false), [])

  // load game data
  useEffect(() => {
    if (game.data !== undefined) {
      // game data already loaded
      return
    }

    let id = window.location.pathname
    if (id.endsWith("/")) {
      id = id.substring(0, id.length - 1)
    }
    id = id.substring(id.lastIndexOf("/") + 1)

    let url
    if (id === null || id === "") {
      url = "/empty-grid.json"
    } else {
      url = DATABASE_URL.replace("{}", id)
    }

    async function load() {
      let response = await fetch(url)
      let json = await response.json()
      // TODO better error handling
      if (json.error === undefined) {
        updateGame({
          type: TYPE_RESTART,
          data: json
        })
      }
    }

    // TODO better error handling
    load().catch(e => console.error(e))
  }, [game.data, updateGame])

  // register keyboard handlers
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === " ") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_ROTATE
        })
        e.preventDefault()
      } else if (e.key === "Meta" || e.key === "Control") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_CENTRE
        })
        e.preventDefault()
      } else if (e.key === "Shift") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_CORNER
        })
        e.preventDefault()
      } else if (e.key === "Alt") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_COLOUR
        })
        e.preventDefault()
      } else if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        updateGame({
          type: e.shiftKey ? TYPE_REDO : TYPE_UNDO
        })
        e.preventDefault()
      } else if (e.key === "y" && (e.metaKey || e.ctrlKey)) {
        updateGame({
          type: TYPE_REDO
        })
        e.preventDefault()
      } else if (e.code === "KeyZ") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_NORMAL
        })
        e.preventDefault()
      } else if (e.code === "KeyX") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_CORNER
        })
        e.preventDefault()
      } else if (e.code === "KeyC") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_CENTRE
        })
        e.preventDefault()
      } else if (e.code === "KeyV") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_COLOUR
        })
        e.preventDefault()
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_RIGHT,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_LEFT,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.code === "ArrowUp" || e.code === "KeyW") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_UP,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_DOWN,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      }
    }

    function onKeyUp(e) {
      if (e.key === "Meta" || e.key === "Control" || e.key === "Shift" || e.key === "Alt") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_REMOVE
        })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    return () => {
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [updateGame])

  // register resize handler
  useEffect(() => {
    function onResize() {
      let style = window.getComputedStyle(gameContainerRef.current)
      let w = gameContainerRef.current.clientWidth - parseInt(style.paddingLeft) - parseInt(style.paddingRight)
      let h = gameContainerRef.current.clientHeight - parseInt(style.paddingTop) - parseInt(style.paddingBottom)
      let portrait = window.innerHeight > window.innerWidth
      if (portrait) {
        setGridMaxWidth(w)
        setGridMaxHeight(h - padContainerRef.current.offsetHeight)
      } else {
        setGridMaxWidth(w - padContainerRef.current.offsetWidth)
        setGridMaxHeight(h)
      }
      setPortrait(portrait)
    }

    window.addEventListener("resize", onResize)
    onResize()

    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (<>
    <Head>
      <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
      <meta name="description" content="Sudoku"/>
      <meta name="robots" content="index,follow"/>
      <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet"/>
      <title>Sudoku</title>
    </Head>
    <div className="app" data-theme={settings.theme} data-colour-palette={settings.colourPalette}>
      <StatusBar onHeightChange={onStatusBarHeightChange} />
      <div className="game-container" onClick={clearSelection} ref={gameContainerRef}>
        <div className="grid-container">
          {game.data && <Grid portrait={portrait} maxWidth={gridMaxWidth}
            maxHeight={gridMaxHeight - (statusBarHeight + STATUS_BAR_GAP) * 2}
            onFinishRender={onFinishRender} />}
        </div>
        {rendering && <div className="loading">
          Loading ...
        </div>}
        <div className="pad-container" ref={padContainerRef}>
          {rendering || <Pad />}
        </div>
        <Sidebar />
      </div>
      <style jsx>{styles}</style>
    </div>
  </>)
}

export default Index
