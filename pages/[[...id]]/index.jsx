import GameContext from "../../components/contexts/GameContext"
import SettingsContext from "../../components/contexts/SettingsContext"
import Grid from "../../components/Grid"
import Pad from "../../components/Pad"
import Sidebar from "../../components/Sidebar"
import StatusBar from "../../components/StatusBar"
import { TYPE_MODE, TYPE_SELECTION, TYPE_UNDO, TYPE_REDO, TYPE_RESTART,
  ACTION_ALL, ACTION_SET, ACTION_PUSH, ACTION_CLEAR, ACTION_REMOVE, ACTION_ROTATE,
  ACTION_RIGHT, ACTION_LEFT, ACTION_UP, ACTION_DOWN } from "../../components/lib/Actions"
import { MODE_NORMAL, MODE_CORNER, MODE_CENTRE, MODE_COLOUR } from "../../components/lib/Modes"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import Head from "next/head"
import styles from "./index.scss"

const DATABASE_URL = "https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/{}?alt=media"

const Index = () => {
  const game = useContext(GameContext.State)
  const updateGame = useContext(GameContext.Dispatch)
  const settings = useContext(SettingsContext.State)
  const appRef = useRef()
  const gameContainerRef = useRef()
  const gridContainerRef = useRef()
  const padContainerRef = useRef()
  const [gridMaxWidth, setGridMaxWidth] = useState(0)
  const [gridMaxHeight, setGridMaxHeight] = useState(0)
  const [portrait, setPortrait] = useState(false)
  const [rendering, setRendering] = useState(true)

  function onMouseDown(e) {
    // check if we hit a target that would clear the selction
    let shouldClearSelection = e.target === appRef.current ||
      e.target === gameContainerRef.current ||
      e.target === gridContainerRef.current ||
      e.target === padContainerRef.current ||
      // pad itself but not its buttons
      e.target.parentElement === padContainerRef.current

    if (shouldClearSelection) {
      updateGame({
        type: TYPE_SELECTION,
        action: ACTION_CLEAR
      })
    }
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
      } else if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) {
        updateGame({
          type: e.shiftKey ? TYPE_REDO : TYPE_UNDO
        })
        e.preventDefault()
      } else if (e.key === "y" && (e.metaKey || e.ctrlKey)) {
        updateGame({
          type: TYPE_REDO
        })
        e.preventDefault()
      } else if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_ALL
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
      } else if (e.key === "ArrowRight" || e.code === "KeyD") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_RIGHT,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.key === "ArrowLeft" || e.code === "KeyA") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_LEFT,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.key === "ArrowUp" || e.code === "KeyW") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_UP,
          append: (e.metaKey || e.ctrlKey)
        })
        e.preventDefault()
      } else if (e.key === "ArrowDown" || e.code === "KeyS") {
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
    let oldW = 0
    let oldH = 0

    function onResize() {
      let style = window.getComputedStyle(gameContainerRef.current)
      let w = gameContainerRef.current.clientWidth - parseInt(style.paddingLeft) - parseInt(style.paddingRight)
      let h = gameContainerRef.current.clientHeight - parseInt(style.paddingTop) - parseInt(style.paddingBottom)
      let portrait = window.innerHeight > window.innerWidth
      let newW
      let newH
      if (portrait) {
        newW = w
        newH = h - padContainerRef.current.offsetHeight
      } else {
        newW = w - padContainerRef.current.offsetWidth
        newH = h
      }
      if (oldW !== newW || oldH !== newH) {
        setGridMaxWidth(newW)
        setGridMaxHeight(newH)
        oldW = newW
        oldH = newH
      }
      setPortrait(portrait)
    }

    window.addEventListener("resize", onResize)
    onResize()

    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [])

  // register beforeunload handler
  useEffect(() => {
    if (typeof process !== "undefined" && process.env !== undefined &&
        process.env.NODE_ENV === "development") {
      // disable this feature in development mode
      return
    }

    function onBeforeUnload(e) {
      if (game.nextUndoState === 0 || game.solved) {
        // nothing to lose - we can close the tab
        return
      }

      e.preventDefault()

      // Chrome requires returnValue to be set
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", onBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
    }
  }, [game.nextUndoState, game.solved])

  return (<>
    <Head>
      <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
      <meta name="description" content="Sudoku"/>
      <meta name="robots" content="index,follow"/>
      <link rel="preconnect" href="https://fonts.gstatic.com"/>
      <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&display=swap" rel="stylesheet"/>
      <title>Sudoku</title>
    </Head>
    <div className="app" data-theme={settings.theme} data-colour-palette={settings.colourPalette}
        onMouseDown={onMouseDown} ref={appRef}>
      <StatusBar />
      <div className="game-container" ref={gameContainerRef}>
        <div className="grid-container" ref={gridContainerRef}>
          {game.data && <Grid portrait={portrait} maxWidth={gridMaxWidth}
            maxHeight={gridMaxHeight} onFinishRender={onFinishRender} />}
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
