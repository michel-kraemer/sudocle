import GameContext from "../../components/contexts/GameContext"
import SettingsContext from "../../components/contexts/SettingsContext"
import Grid from "../../components/Grid"
import Modal from "../../components/Modal"
import Pad from "../../components/Pad"
import Sidebar from "../../components/Sidebar"
import StatusBar from "../../components/StatusBar"
import {
  TYPE_MODE,
  TYPE_MODE_GROUP,
  TYPE_SELECTION,
  TYPE_UNDO,
  TYPE_REDO,
  TYPE_INIT,
  TYPE_SUDOKURULE,
  TYPE_DIGITS,
  ACTION_ALL,
  ACTION_SET,
  ACTION_PUSH,
  ACTION_CLEAR,
  ACTION_REMOVE,
  ACTION_ROTATE,
  ACTION_RIGHT,
  ACTION_LEFT,
  ACTION_UP,
  ACTION_DOWN
} from "../../components/lib/Actions"
import {
  MODE_NORMAL,
  MODE_CORNER,
  MODE_CENTRE,
  MODE_COLOUR,
  MODE_PEN
} from "../../components/lib/Modes"
import { Data } from "../../components/types/Data"
import { convertCTCPuzzle } from "../../components/lib/ctcpuzzleconverter"
import { convertFPuzzle } from "../../components/lib/fpuzzlesconverter"
import {
  MouseEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react"
import FontFaceObserver from "fontfaceobserver"
import { Frown, ThumbsUp } from "lucide-react"
import Head from "next/head"
import lzwDecompress from "../../components/lib/lzwdecompressor"
import styles from "./index.scss"

const DATABASE_URL =
  "https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/{}?alt=media"
const FALLBACK_URL = `${process.env.basePath}/puzzles/{}.json`

const Index = () => {
  const game = useContext(GameContext.State)
  const updateGame = useContext(GameContext.Dispatch)
  const settings = useContext(SettingsContext.State)
  const appRef = useRef<HTMLDivElement>(null)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const padContainerRef = useRef<HTMLDivElement>(null)
  const [gridMaxWidth, setGridMaxWidth] = useState(0)
  const [gridMaxHeight, setGridMaxHeight] = useState(0)
  const [portrait, setPortrait] = useState(false)
  const [rendering, setRendering] = useState(true)
  const [error, setError] = useState<ReactNode>()
  const [solvedModalOpen, setSolvedModalOpen] = useState<boolean>(false)
  const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false)
  const [isTest, setIsTest] = useState(false)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    // check if we hit a target that would clear the selction
    let shouldClearSelection =
      e.target === appRef.current ||
      e.target === gameContainerRef.current ||
      e.target === gridContainerRef.current ||
      e.target === padContainerRef.current ||
      // pad itself but not its buttons
      (e.target as Node).parentElement === padContainerRef.current

    if (shouldClearSelection) {
      updateGame({
        type: TYPE_SELECTION,
        action: ACTION_CLEAR
      })
    }
  }

  const onFinishRender = useCallback(() => setRendering(false), [])

  function collectTextToLoad(data: Data): string {
    let characters = new Set(Array.from("0BESbswy"))
    let datastr = JSON.stringify(JSON.stringify(data))
    // only add non-latin characters
    for (let c of datastr) {
      if (c > "\u00FF") {
        characters.add(c)
      }
    }
    return [...characters].join("")
  }

  // load game data
  useEffect(() => {
    if (game.data.cells.length > 0) {
      // game data already loaded
      return
    }

    let id = window.location.pathname
    if (process.env.basePath) {
      id = id.substring(process.env.basePath.length)
    }
    if (id.endsWith("/")) {
      id = id.substring(0, id.length - 1)
    }
    id = id.substring(id.lastIndexOf("/") + 1)

    if (id === null || id === "") {
      let s = new URLSearchParams(window.location.search)
      let puzzleId = s.get("puzzleid")
      let fpuzzlesId = s.get("fpuzzles")
      let fpuz = s.get("fpuz")
      let ctcId = s.get("ctc")
      let sclId = s.get("scl")
      if (
        fpuzzlesId === null &&
        puzzleId !== null &&
        puzzleId.startsWith("fpuzzles")
      ) {
        fpuzzlesId = puzzleId
      }
      if (fpuz === null && puzzleId !== null && puzzleId.startsWith("fpuz")) {
        fpuz = puzzleId
      }
      if (ctcId === null && puzzleId !== null && puzzleId.startsWith("ctc")) {
        ctcId = puzzleId
      }
      if (sclId === null && puzzleId !== null && puzzleId.startsWith("scl")) {
        sclId = puzzleId
      }
      if (fpuzzlesId !== null) {
        id = fpuzzlesId
        if (!id.startsWith("fpuzzles")) {
          id = "fpuzzles" + id
        }
      }
      if (fpuz !== null) {
        id = fpuz
        if (!id.startsWith("fpuz")) {
          id = "fpuz" + id
        }
      }
      if (ctcId !== null) {
        id = ctcId
        if (!id.startsWith("ctc")) {
          id = "ctc" + id
        }
      }
      if (sclId !== null) {
        id = sclId
        if (!id.startsWith("scl")) {
          id = "scl" + id
        }
      }

      let testId = s.get("test")
      if (testId !== null) {
        id = "test"
      }
    }

    async function load(url: string, fallbackUrl: string) {
      let fallbackUsed = false
      let response = await fetch(url)
      if (response.status !== 200) {
        response = await fetch(fallbackUrl)
        fallbackUsed = true
      }
      if (response.status === 404) {
        setError(`The puzzle with the ID ‘${id}’ does not exist`)
      } else if (response.status !== 200) {
        setError(
          <>
            Failed to load puzzle with ID ‘{id}’.
            <br />
            Received HTTP status code {response.status} from server.
          </>
        )
      } else {
        let json
        try {
          json = await response.json()
        } catch (e) {
          if (
            fallbackUsed &&
            e instanceof Error &&
            e.message.includes("<!DOCTYPE")
          ) {
            setError(`The puzzle with the ID ‘${id}’ does not exist`)
            return
          }
          setError(<>Failed to load puzzle with ID ‘{id}’. Parse error.</>)
          throw e
        }
        if (json.error === undefined) {
          updateGame({
            type: TYPE_INIT,
            data: json
          })
        }
      }
    }

    async function loadCompressedPuzzle() {
      let puzzle: string
      if (id.length > 16 && id.startsWith("fpuzzles")) {
        puzzle = decodeURIComponent(id.substring(8))
      } else if (id.length > 16 && id.startsWith("fpuz")) {
        puzzle = decodeURIComponent(id.substring(4))
      } else if (
        id.length > 16 &&
        (id.startsWith("ctc") || id.startsWith("scl"))
      ) {
        puzzle = decodeURIComponent(id.substring(3))
      } else {
        throw new Error("Unsupported puzzle ID")
      }

      let buf = Buffer.from(puzzle, "base64")
      let str: string | undefined
      try {
        str = lzwDecompress(buf)
      } catch (e) {
        str = undefined
      }

      if (str === undefined) {
        let buf = Buffer.from(puzzle.replace(/ /g, "+"), "base64")
        str = lzwDecompress(buf)
      }

      if (str === undefined) {
        throw new Error("Puzzle ID could not be decompressed")
      }

      let convertedPuzzle: Data
      if (
        id.length > 16 &&
        (id.startsWith("fpuzzles") || id.startsWith("fpuz"))
      ) {
        convertedPuzzle = convertFPuzzle(JSON.parse(str))
      } else if (
        id.length > 16 &&
        (id.startsWith("ctc") || id.startsWith("scl"))
      ) {
        convertedPuzzle = convertCTCPuzzle(str)
      } else {
        throw new Error("Unsupported puzzle ID")
      }

      updateGame({
        type: TYPE_INIT,
        data: convertedPuzzle
      })
    }

    async function loadTest() {
      let w = window as any
      w.initTestGrid = function (json: any) {
        if (
          json.fpuzzles !== undefined ||
          json.ctc !== undefined ||
          json.scl !== undefined
        ) {
          let buf = Buffer.from(json.fpuzzles ?? json.ctc ?? json.scl, "base64")
          let str = lzwDecompress(buf)!
          if (json.fpuzzles !== undefined) {
            json = convertFPuzzle(JSON.parse(str))
          } else {
            console.log(str)
            json = convertCTCPuzzle(str)
          }
        }
        setIsTest(true)
        updateGame({
          type: TYPE_INIT,
          data: json
        })
        return json
      }
      w.resetTestGrid = function () {
        setFontsLoaded(false) // make sure fonts for the next grid will be loaded
        updateGame({
          type: TYPE_INIT,
          data: undefined
        })
        setIsTest(false)
      }
    }

    if (
      id.startsWith("fpuzzles") ||
      id.startsWith("fpuz") ||
      id.startsWith("ctc") ||
      id.startsWith("scl")
    ) {
      loadCompressedPuzzle()
    } else if (id === "test") {
      loadTest()
    } else {
      let url
      let fallbackUrl
      if (id === null || id === "") {
        url = `${process.env.basePath}/empty-grid.json`
        fallbackUrl = url
      } else {
        url = DATABASE_URL.replace("{}", id)
        fallbackUrl = FALLBACK_URL.replace("{}", id)
      }
      load(url, fallbackUrl)
    }
  }, [game.data, updateGame])

  useEffect(() => {
    if (game.data.cells.length === 0) {
      // game is not loaded yet
      return
    }

    // make sure all required fonts are loaded
    let fontRoboto300 = new FontFaceObserver("Roboto", {
      weight: 300
    })
    let fontRoboto700 = new FontFaceObserver("Roboto", {
      weight: 700
    })
    let textToLoad = collectTextToLoad(game.data)
    Promise.all([
      fontRoboto300.load(textToLoad),
      fontRoboto700.load(textToLoad)
    ]).then(
      () => {
        setFontsLoaded(true)
      },
      () => {
        console.warn("Roboto font is not available. Using fallback font.")
        setFontsLoaded(true)
      }
    )
  }, [game.data])

  // register keyboard handlers
  useEffect(() => {
    let metaPressed = false
    let shiftPressed = false
    let altPressed = false

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === " ") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_ROTATE
        })
        e.preventDefault()
      } else if (
        e.key === "Tab" &&
        !metaPressed &&
        !shiftPressed &&
        !altPressed
      ) {
        updateGame({
          type: TYPE_MODE_GROUP,
          action: ACTION_ROTATE
        })
        e.preventDefault()
      } else if (e.key === "Meta" || e.key === "Control") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_CENTRE
        })
        metaPressed = true
        e.preventDefault()
      } else if (e.key === "Shift") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_CORNER
        })
        shiftPressed = true
        e.preventDefault()
      } else if (e.key === "Alt") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_PUSH,
          mode: MODE_COLOUR
        })
        altPressed = true
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
          type: TYPE_DIGITS,
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
      } else if (e.code === "KeyP") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_SET,
          mode: MODE_PEN
        })
        e.preventDefault()
      } else if (e.key === "ArrowRight") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_RIGHT,
          append: e.metaKey || e.ctrlKey
        })
        e.preventDefault()
      } else if (e.key === "ArrowLeft") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_LEFT,
          append: e.metaKey || e.ctrlKey
        })
        e.preventDefault()
      } else if (e.key === "ArrowUp") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_UP,
          append: e.metaKey || e.ctrlKey
        })
        e.preventDefault()
      } else if (e.key === "ArrowDown") {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_DOWN,
          append: e.metaKey || e.ctrlKey
        })
        e.preventDefault()
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Meta" || e.key === "Control") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_REMOVE,
          mode: MODE_CENTRE
        })
        metaPressed = false
        e.preventDefault()
      } else if (e.key === "Shift") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_REMOVE,
          mode: MODE_CORNER
        })
        shiftPressed = false
        e.preventDefault()
      } else if (e.key === "Alt") {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_REMOVE,
          mode: MODE_COLOUR
        })
        altPressed = false
        e.preventDefault()
      }
    }

    function onBlur() {
      if (metaPressed) {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_REMOVE,
          mode: MODE_CENTRE
        })
        metaPressed = false
      } else if (shiftPressed) {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_REMOVE,
          mode: MODE_CORNER
        })
        shiftPressed = false
      } else if (altPressed) {
        updateGame({
          type: TYPE_MODE,
          action: ACTION_REMOVE,
          mode: MODE_COLOUR
        })
        altPressed = false
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)

    return () => {
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [updateGame])

  // register resize handler
  useEffect(() => {
    let oldW = 0
    let oldH = 0

    function onResize() {
      let style = window.getComputedStyle(gameContainerRef.current!)
      let w =
        gameContainerRef.current!.clientWidth -
        parseInt(style.paddingLeft) -
        parseInt(style.paddingRight)
      let h =
        gameContainerRef.current!.clientHeight -
        parseInt(style.paddingTop) -
        parseInt(style.paddingBottom)
      let portrait = window.innerHeight > window.innerWidth
      let newW
      let newH
      if (portrait) {
        newW = w
        newH = h - padContainerRef.current!.offsetHeight
      } else {
        newW = w - padContainerRef.current!.offsetWidth
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
    if (
      typeof process !== "undefined" &&
      process.env !== undefined &&
      process.env.NODE_ENV === "development"
    ) {
      // disable this feature in development mode
      return
    }

    function onBeforeUnload(e: BeforeUnloadEvent) {
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

  useEffect(() => {
    if (game.errors.size > 0) {
      setErrorModalOpen(true)
    } else if (game.solved) {
      setSolvedModalOpen(true)
    }
  }, [game.errors.size, game.solved, game.checkCounter])

  return (
    <>
      <Head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta
          name="description"
          content="A modern web app for Sudoku inspired by Cracking the Cryptic"
        />
        <meta name="robots" content="index,follow" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />

        <link
          rel="shortcut icon"
          href={`${process.env.basePath}/favicons/favicon.ico`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${process.env.basePath}/favicons/favicon-16x16.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${process.env.basePath}/favicons/favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="48x48"
          href={`${process.env.basePath}/favicons/favicon-48x48.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href={`${process.env.basePath}/favicons/apple-touch-icon-57x57.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href={`${process.env.basePath}/favicons/apple-touch-icon-60x60.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href={`${process.env.basePath}/favicons/apple-touch-icon-72x72.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href={`${process.env.basePath}/favicons/apple-touch-icon-76x76.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href={`${process.env.basePath}/favicons/apple-touch-icon-114x114.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href={`${process.env.basePath}/favicons/apple-touch-icon-120x120.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href={`${process.env.basePath}/favicons/apple-touch-icon-144x144.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href={`${process.env.basePath}/favicons/apple-touch-icon-152x152.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href={`${process.env.basePath}/favicons/apple-touch-icon-167x167.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${process.env.basePath}/favicons/apple-touch-icon-180x180.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="1024x1024"
          href={`${process.env.basePath}/favicons/apple-touch-icon-1024x1024.png`}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Sudocle" />

        <title>Sudocle</title>
      </Head>
      <div
        className="app"
        data-theme={settings.theme}
        data-colour-palette={settings.colourPalette}
        onMouseDown={onMouseDown}
        ref={appRef}
      >
        {!isTest && <StatusBar />}
        <div className="game-container" ref={gameContainerRef}>
          <div className="grid-container" ref={gridContainerRef}>
            {game.data && game.data.cells.length > 0 && fontsLoaded && (
              <Grid
                portrait={portrait}
                maxWidth={gridMaxWidth}
                maxHeight={gridMaxHeight}
                onFinishRender={onFinishRender}
              />
            )}
          </div>
          {rendering && !error && <div className="loading">Loading ...</div>}
          {error && <div className="error">{error}</div>}
          <div className="pad-container" ref={padContainerRef}>
            {rendering || <Pad />}
          </div>
          <Sidebar />
        </div>

        <Modal
          isOpen={solvedModalOpen}
          title="Congratulations!"
          icon={<ThumbsUp size="3.25em" />}
          onOK={() => setSolvedModalOpen(false)}
        >
          You have solved the puzzle
        </Modal>
        <Modal
          isOpen={errorModalOpen}
          title="Sorry"
          alert
          icon={<Frown size="3.25em" />}
          onOK={() => setErrorModalOpen(false)}
        >
          Something seems to be wrong
        </Modal>

        <style jsx>{styles}</style>
      </div>
    </>
  )
}

export default Index
