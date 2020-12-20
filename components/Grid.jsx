// import data from "../Qh7QjthLmb.json"
import data from "../jGjPpHfLtM.json"
import polygonClipping from "polygon-clipping"
import styles from "./Grid.scss"
import { useEffect, useRef, useReducer } from "react"
import { flatten } from "lodash"

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

function selectedCellsReducer(state, action) {
  switch (action.type) {
    case "clear":
      return []
    case "set":
      return [action.data]
    case "push":
      return [...state, action.data]
  }
  return state
}

const Grid = () => {
  const ref = useRef()
  const app = useRef()
  const cells = useRef()

  const [selectedCells, updateSelectedCells] = useReducer(selectedCellsReducer, [])

  function selectCell(cell, append = false) {
    updateSelectedCells({
      type: append ? "push" : "set",
      data: cell.data
    })
  }

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
    cells.current = new PIXI.Container()

    grid.sortableChildren = true

    // render cells
    data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let cell = new PIXI.Graphics()
        cell.interactive = true
        cell.buttonMode = true

        cell.data = {
          row: x,
          col: y
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

        cells.current.addChild(cell)
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

    let text = new PIXI.Text(8, {
      fontFamily: "Tahoma, Verdana, sans-serif",
      fontSize: 40
    })
    text.zIndex = 1
    text.x = CELL_SIZE / 2
    text.y = CELL_SIZE / 2 - 0.5
    text.anchor.set(0.5)
    grid.addChild(text)

    grid.x = 100
    grid.y = 100

    grid.addChild(cells.current)
    newApp.stage.addChild(grid)
    newApp.render()

    return () => {
      newApp.destroy({
        removeView: true
      })
      app.current = undefined
    }
  }, [])

  useEffect(() => {
    cells.current.children.forEach(cell => {
      let data = selectedCells.find(sc =>
        sc.row === cell.data.row && sc.col === cell.data.col)
      cell.children[0].alpha = data === undefined ? 0 : 1
    })
    app.current.render()
  }, [selectedCells])

  return (
    <div ref={ref} className="grid">
      <style jsx>{styles}</style>
    </div>
  )
}

export default Grid
