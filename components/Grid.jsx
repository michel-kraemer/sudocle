// import data from "../Qh7QjthLmb.json"
import data from "../jGjPpHfLtM.json"
import polygonClipping from "polygon-clipping"
import styles from "./Grid.scss"
import { useCallback, useEffect, useRef, useReducer } from "react"
import { flatten } from "lodash"

const TYPE_DIGITS = "digits"
const TYPE_SELECTION = "selection"

const ACTION_SET = "set"
const ACTION_PUSH = "push"
const ACTION_CLEAR = "clear"
const ACTION_REMOVE = "remove"

const CELL_SIZE = data.cellSize * 1.1

let PIXI
if (typeof window !== "undefined") {
  PIXI = require("pixi.js")
}

const regions = data.regions.map(region => {
  let polys = region.map(cell => {
    let y = cell[0]
    let x = cell[1]
    return [[
      [(x + 0) * CELL_SIZE, (y + 0) * CELL_SIZE],
      [(x + 1) * CELL_SIZE, (y + 0) * CELL_SIZE],
      [(x + 1) * CELL_SIZE, (y + 1) * CELL_SIZE],
      [(x + 0) * CELL_SIZE, (y + 1) * CELL_SIZE]
    ]]
  })
  let unions = polygonClipping.union(polys)
  for (let u of unions) {
    for (let p of u) {
      let f = p[0]
      let l = p[p.length - 1]
      if (f[0] !== l[0] && f[1] !== l[1]) {
        p.push(f)
      }
    }
  }
  return unions
})

function eqCell(a, b) {
  return a.row === b.row && a.col === b.col
}

function digitsReducer(state, action, selection) {
  switch (action.action) {
    case ACTION_SET: {
      let newState = state
      for (let sc of selection) {
        newState = [...newState.filter(c => !eqCell(sc, c.data)), {
          data: sc,
          digit: action.digit
        }]
      }
      return newState
    }

    case ACTION_REMOVE: {
      let newState = state
      for (let sc of selection) {
        newState = [...newState.filter(c => !eqCell(sc, c.data))]
      }
      return newState
    }
  }
  return state
}

function selectionReducer(state, action) {
  switch (action.action) {
    case ACTION_CLEAR:
      return []
    case ACTION_SET:
      return [action.data]
    case ACTION_PUSH:
      return [...state, action.data]
    case ACTION_REMOVE:
      return [...state.filter(c => !eqCell(c, action.data))]
  }
  return state
}

function gameReducer(state, action) {
  switch (action.type) {
    case TYPE_DIGITS:
      return {
        ...state,
        digits: digitsReducer(state.digits, action, state.selection)
      }

    case TYPE_SELECTION:
      return {
        ...state,
        selection: selectionReducer(state.selection, action)
      }
  }
  return state
}

const Grid = () => {
  const ref = useRef()
  const app = useRef()
  const cellElements = useRef([])
  const digitElements = useRef([])
  const keyMetaPressed = useRef(false)
  const keyShiftPressed = useRef(false)

  const [game, updateGame] = useReducer(gameReducer, {
    digits: [],
    selection: []
  })

  function selectCell(cell, append = false) {
    let action = append ? ACTION_PUSH : ACTION_SET
    if (keyMetaPressed.current) {
      if (keyShiftPressed.current) {
        action = ACTION_REMOVE
      } else {
        action = ACTION_PUSH
      }
    }
    updateGame({
      type: TYPE_SELECTION,
      action,
      data: cell.data
    })
  }

  const onKey = useCallback(e => {
    keyShiftPressed.current = e.shiftKey
    keyMetaPressed.current = e.metaKey
  }, [])

  const onKeyDown = useCallback(e => {
    onKey(e)

    if (e.key >= "1" && e.key <= "9") {
      updateGame({
        type: TYPE_DIGITS,
        action: ACTION_SET,
        digit: +e.key
      })
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      updateGame({
        type: TYPE_DIGITS,
        action: ACTION_REMOVE
      })
    }
  }, [onKey])

  const onKeyUp = useCallback(e => {
    onKey(e)
  }, [onKey])

  useEffect(() => {
    // create PixiJS app
    let newApp = new PIXI.Application({
      resolution: window.devicePixelRatio,
      antialias: true,
      transparent: true,
      autoDensity: true,
      resizeTo: ref.current,
      autoStart: false
    })
    ref.current.appendChild(newApp.view)

    app.current = newApp

    // create grid
    let grid = new PIXI.Container()
    let cells = new PIXI.Container()

    grid.sortableChildren = true

    // render cells
    data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let cell = new PIXI.Graphics()
        cell.interactive = true
        cell.buttonMode = true

        cell.data = {
          row: y,
          col: x
        }

        cell.lineStyle({ width: 1, color: 0 })
        cell.drawRect(0, 0, CELL_SIZE, CELL_SIZE)

        cell.x = x * CELL_SIZE
        cell.y = y * CELL_SIZE

        // since our cells have a transparent background, we need to
        // define a hit area
        cell.hitArea = new PIXI.Rectangle(0, 0, CELL_SIZE, CELL_SIZE)

        // add an invisible rectangle for selection
        let selection = new PIXI.Graphics()
        selection.beginFill(0xffd700, 0.5)
        selection.drawRect(0.5, 0.5, CELL_SIZE - 1, CELL_SIZE - 1)
        selection.endFill()
        selection.alpha = 0
        cell.addChild(selection)

        cell.on("pointerdown", function () {
          selectCell(this)
        })

        cell.on("pointerover", function (e) {
          if (e.data.buttons === 1) {
            selectCell(this, true)
          }
        })

        cells.addChild(cell)
        cellElements.current.push(cell)
      })
    })

    // render regions
    for (let region of regions) {
      for (let outlines of region) {
        for (let outline of outlines) {
          let poly = new PIXI.Graphics()
          poly.lineStyle({ width: 3, color: 0 })
          poly.drawPolygon(flatten(outline))
          poly.zIndex = 1
          grid.addChild(poly)
        }
      }
    }

    // create empty text elements for all digits
    data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let text = new PIXI.Text("", {
          fontFamily: "Tahoma, Verdana, sans-serif",
          fontSize: 40
        })
        text.zIndex = 1
        text.x = x * CELL_SIZE + CELL_SIZE / 2
        text.y = y * CELL_SIZE + CELL_SIZE / 2 - 0.5
        text.anchor.set(0.5)
        text.data = {
          row: y,
          col: x
        }
        grid.addChild(text)
        digitElements.current.push(text)
      })
    })

    grid.x = 100
    grid.y = 100

    grid.addChild(cells)
    newApp.stage.addChild(grid)
    newApp.render()

    return () => {
      newApp.destroy({
        removeView: true
      })
      app.current = undefined
    }
  }, [])

  // register keyboard handlers
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [onKeyDown, onKeyUp])

  useEffect(() => {
    cellElements.current.forEach(cell => {
      let data = game.selection.find(sc => eqCell(sc, cell.data))
      cell.children[0].alpha = data === undefined ? 0 : 1
    })
    app.current.render()
  }, [game.selection])

  useEffect(() => {
    for (let e of digitElements.current) {
      let digit = game.digits.find(d => eqCell(d.data, e.data))
      if (digit !== undefined) {
        e.text = digit.digit
        e.style.fill = digit.given ? 0 : 0x316bdd
      } else {
        e.text = ""
      }
    }
    app.current.render()
  }, [game.digits])

  return (
    <div ref={ref} className="grid">
      <style jsx>{styles}</style>
    </div>
  )
}

export default Grid
