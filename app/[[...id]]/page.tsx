"use client"

import {
  Dispatch as GameContextDispatch,
  State as GameContextState
} from "../../components/contexts/GameContext"
import { State as SettingsContextState } from "../../components/contexts/SettingsContext"
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
import lzwDecompress from "../../components/lib/lzwdecompressor"
import { enableMapSet } from "immer"

enableMapSet()

const URLS = [
  "https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/{}?alt=media",
  "https://sudokupad.app/api/puzzle/{}",
  `${process.env.basePath}/puzzles/{}.json`
]

const IndexPage = () => {
  const game = useContext(GameContextState)
  const updateGame = useContext(GameContextDispatch)
  const settings = useContext(SettingsContextState)
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

  async function fetchFromApi(id: string): Promise<string> {
    let urls
    if (id === null || id === "") {
      urls = [`${process.env.basePath}/empty-grid.json`]
    } else {
      urls = URLS.map(url => url.replace("{}", id))
    }

    let response: Response | undefined
    for (let url of urls) {
      response = await fetch(url)
      if (response.status === 200) {
        return response.text()
      }
    }

    if (response === undefined) {
      throw new Error("No puzzle loaded")
    }

    if (response.status === 404) {
      throw new Error(`The puzzle with the ID \u2018${id}’ does not exist`)
    }

    throw new Error(
      `Failed to load puzzle with ID \u2018${id}’. ` +
        `Received HTTP status code ${response.status} from server.`
    )
  }

  const loadCompressedPuzzleFromString = useCallback(
    (str: string) => {
      let puzzle: string
      if (str.length > 16 && str.startsWith("fpuzzles")) {
        puzzle = decodeURIComponent(str.substring(8))
      } else if (str.length > 16 && str.startsWith("fpuz")) {
        puzzle = decodeURIComponent(str.substring(4))
      } else if (
        str.length > 16 &&
        (str.startsWith("ctc") || str.startsWith("scl"))
      ) {
        puzzle = decodeURIComponent(str.substring(3))
      } else {
        setError("Unsupported puzzle ID")
        return
      }

      puzzle = puzzle.replace(/ /g, "+")

      let buf = Buffer.from(puzzle, "base64")
      let decompressedStr: string | undefined
      try {
        decompressedStr = lzwDecompress(buf)
      } catch (e) {
        decompressedStr = undefined
      }

      if (decompressedStr === undefined) {
        setError("Puzzle ID could not be decompressed")
        return
      }

      let convertedPuzzle: Data
      if (
        str.length > 16 &&
        (str.startsWith("fpuzzles") || str.startsWith("fpuz"))
      ) {
        convertedPuzzle = convertFPuzzle(JSON.parse(decompressedStr))
      } else if (
        str.length > 16 &&
        (str.startsWith("ctc") || str.startsWith("scl"))
      ) {
        convertedPuzzle = convertCTCPuzzle(decompressedStr)
      } else {
        setError("Unsupported puzzle ID")
        return
      }

      updateGame({
        type: TYPE_INIT,
        data: convertedPuzzle
      })
    },
    [updateGame]
  )

  const loadFromTest = useCallback(() => {
    let w = window as any
    w.initTestGrid = function (json: any) {
      if (
        json.fpuzzles !== undefined ||
        json.ctc !== undefined ||
        json.scl !== undefined ||
        json.fpuz !== undefined
      ) {
        let puzzle = json.fpuzzles ?? json.ctc ?? json.scl ?? json.fpuz
        puzzle = decodeURIComponent(puzzle).replace(/ /g, "+")
        let buf = Buffer.from(puzzle, "base64")
        let str = lzwDecompress(buf)!
        if (json.fpuzzles !== undefined || json.fpuz !== undefined) {
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
  }, [updateGame])

  const loadFromId = useCallback(
    async (id: string, data: string = id) => {
      if (
        data.startsWith("fpuzzles") ||
        data.startsWith("fpuz") ||
        data.startsWith("ctc") ||
        data.startsWith("scl")
      ) {
        loadCompressedPuzzleFromString(data)
      } else if (data === "test") {
        loadFromTest()
      } else if (data.startsWith("{")) {
        let json
        try {
          json = JSON.parse(data)
        } catch (e) {
          try {
            json = convertCTCPuzzle(data)
          } catch (e) {
            setError(
              <>Failed to load puzzle with ID &lsquo;{id}’. Parse error.</>
            )
            throw e
          }
        }

        // Filter out invalid elements. For the time being, these are only
        // lines without colour. In the future, we might implement more rules
        // or check the schema against our data model.
        if (
          json.lines !== undefined &&
          Array.isArray(json.lines) &&
          json.lines.some((l: any) => l.color === undefined)
        ) {
          json.lines = json.lines.filter((l: any) => l.color !== undefined)
        }

        updateGame({
          type: TYPE_INIT,
          data: json
        })
      } else {
        let response
        try {
          response = await fetchFromApi(data)
        } catch (e: any) {
          if (e.message !== undefined) {
            setError(e.message)
          } else {
            console.error(e)
          }
          throw e
        }
        await loadFromId(id, response)
      }
    },
    [loadCompressedPuzzleFromString, loadFromTest, updateGame]
  )

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
    if (id.startsWith("/")) {
      id = id.substring(1)
    }

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

    loadFromId(id)
  }, [game.data, loadFromId])

  useEffect(() => {
    if (game.data.cells.length === 0) {
      // game is not loaded yet
      return
    }

    // make sure all required fonts are loaded
    let style = getComputedStyle(document.body)
    let varFontRoboto = style.getPropertyValue("--font-roboto")
    let families = varFontRoboto
      .split(",")
      .map(s => s.trim().replace(/["']/g, ""))
    let observers: FontFaceObserver[] = []
    for (let family of families) {
      let font400 = new FontFaceObserver(family, {
        weight: 400
      })
      let font700 = new FontFaceObserver(family, {
        weight: 700
      })
      observers.push(font400, font700)
    }
    let textToLoad = collectTextToLoad(game.data)
    Promise.all(observers.map(o => o.load(textToLoad))).then(
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
      <div
        className="bg-bg text-fg h-screen"
        data-theme={settings.theme}
        data-colour-palette={settings.colourPalette}
        onMouseDown={onMouseDown}
        ref={appRef}
      >
        {!isTest && <StatusBar />}
        <div
          className="w-screen flex justify-center items-center py-4 px-12 h-[calc(100vh-var(--status-bar-height))] md:h-[calc(100vh-var(--status-bar-height)*2)] md:px-0 portrait:h-[calc(100vh-var(--status-bar-height))] portrait:flex-col portrait:p-4"
          ref={gameContainerRef}
        >
          <div
            className="flex flex-col justify-center items-center h-full"
            ref={gridContainerRef}
          >
            {game.data && game.data.cells.length > 0 && fontsLoaded && (
              <Grid
                portrait={portrait}
                maxWidth={gridMaxWidth}
                maxHeight={gridMaxHeight}
                onFinishRender={onFinishRender}
                fogDisplayOptions={{
                  enableFog: true,
                  enableDropShadow: !isTest
                }}
              />
            )}
          </div>
          {rendering && !error && (
            <div className="text-fg-500">Loading ...</div>
          )}
          {error && <div className="text-alert text-center">{error}</div>}
          <div className="pad-container" ref={padContainerRef}>
            {rendering || <Pad />}
          </div>
          <Sidebar />
        </div>

        <Modal
          isOpen={solvedModalOpen}
          title="Congratulations!"
          icon={<ThumbsUp size="3.25em" />}
          onOpenChange={open => setSolvedModalOpen(open)}
        >
          You have solved the puzzle
        </Modal>
        <Modal
          isOpen={errorModalOpen}
          title="Sorry"
          alert
          icon={<Frown size="3.25em" />}
          onOpenChange={open => setErrorModalOpen(open)}
        >
          Something seems to be wrong
        </Modal>
      </div>
    </>
  )
}

export default IndexPage
