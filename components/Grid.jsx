import data from "../Qh7QjthLmb.json"
// import data from "../jGjPpHfLtM.json"
import { eqCell } from "./lib/utils"
import { TYPE_DIGITS, TYPE_SELECTION, ACTION_CLEAR, ACTION_SET, ACTION_PUSH, ACTION_REMOVE } from "./lib/Actions"
import polygonClipping from "polygon-clipping"
import styles from "./Grid.scss"
import { useCallback, useEffect, useRef } from "react"
import { flatten } from "lodash"

const BLUE_DIGIT = 0x316bdd
const CELL_SIZE = data.cellSize * 1.2

let PIXI
if (typeof window !== "undefined") {
  PIXI = require("pixi.js")
}

function unionCells(cells) {
  let polys = cells.map(cell => {
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
      if (f[0] === l[0] && f[1] === l[1]) {
        p.splice(p.length - 1, 1)
      }
    }
  }
  return unions
}

const regions = data.regions.map(region => {
  return unionCells(region)
})

const cages = data.cages.map(cage => {
  let unions = unionCells(cage.cells, 2)

  // find top-left cell
  let topleft = cage.cells[0]
  for (let cell of cage.cells) {
    if (cell[0] < topleft[0]) {
      topleft = cell
    } else if (cell[0] === topleft[0] && cell[1] < topleft[1]) {
      topleft = cell
    }
  }

  return {
    outlines: unions,
    value: cage.value,
    topleft
  }
})

function hasCageValue(x, y) {
  for (let cage of cages) {
    if (cage.topleft[0] === y && cage.topleft[1] === x) {
      return true
    }
  }
  return false
}

// shrink polygon inwards by distance `d`
function shrinkPolygon(points, d) {
  let result = []

  for (let i = 0; i < points.length; i += 2) {
    let p1x = points[(i - 2 + points.length) % points.length]
    let p1y = points[(i - 1 + points.length) % points.length]
    let p2x = points[(i + 0) % points.length]
    let p2y = points[(i + 1) % points.length]
    let p3x = points[(i + 2) % points.length]
    let p3y = points[(i + 3) % points.length]

    let ax = p2x - p1x
    let ay = p2y - p1y
    let anx = -ay
    let any = ax
    let al = Math.sqrt(anx * anx + any * any)
    anx /= al
    any /= al

    let bx = p3x - p2x
    let by = p3y - p2y
    let bnx = -by
    let bny = bx
    let bl = Math.sqrt(bnx * bnx + bny * bny)
    bnx /= bl
    bny /= bl

    let nx = anx + bnx
    let ny = any + bny

    result.push(p2x + nx * d)
    result.push(p2y + ny * d)
  }

  return result
}

// dispose edges of given polygon by distance `d` whenever they lie on an
// edge of one of the other given polygons
function disposePolygon(points, otherPolygons, d) {
  let result = [...points]
  for (let i = 0; i < points.length; i += 2) {
    let p1x = points[i]
    let p1y = points[i + 1]
    let p2x = points[(i + 2) % points.length]
    let p2y = points[(i + 3) % points.length]

    let sx = p1y < p2y ? -1 : 1
    let sy = p1x > p2x ? -1 : 1

    for (let otherPoints of otherPolygons) {
      let disposed = false
      for (let j = 0; j < otherPoints.length; j += 2) {
        let o1x = otherPoints[j]
        let o1y = otherPoints[j + 1]
        let o2x = otherPoints[(j + 2) % otherPoints.length]
        let o2y = otherPoints[(j + 3) % otherPoints.length]

        if (o1x > o2x) {
          let x = o2x
          o2x = o1x
          o1x = x
        }
        if (o1y > o2y) {
          let y = o2y
          o2y = o1y
          o1y = y
        }

        // simplified because we know edges are always vertical or horizontal
        if (o1x === o2x && p1x === o1x && p2x === o2x &&
            ((o1y <= p1y && o2y >= p1y) || (o1y <= p2y && o2y >= p2y))) {
          result[i] = p1x + d * sx
          result[(i + 2) % points.length] = p2x + d * sx
          disposed = true
          break
        }
        if (o1y === o2y && p1y === o1y && p2y === o2y &&
            ((o1x <= p1x && o2x >= p1x) || (o1x <= p2x && o2x >= p2x))) {
          result[i + 1] = p1y + d * sy
          result[(i + 3) % points.length] = p2y + d * sy
          disposed = true
          break
        }
      }
      if (disposed) {
        break
      }
    }
  }
  return result
}

// based on https://codepen.io/unrealnl/pen/aYaxBW by Erik
// published under the MIT license
function drawDashedPolygon(points, dash, gap, graphics) {
  let dashLeft = 0
  let gapLeft = 0

  for (let i = 0; i < points.length; i += 2) {
    let p1x = points[i]
    let p1y = points[i + 1]
    let p2x = points[(i + 2) % points.length]
    let p2y = points[(i + 3) % points.length]

    let dx = p2x - p1x
    let dy = p2y - p1y

    let len = Math.sqrt(dx * dx + dy * dy)
    let normalx = dx / len
    let normaly = dy / len
    let progressOnLine = 0

    graphics.moveTo(p1x + gapLeft * normalx, p1y + gapLeft * normaly)

    while (progressOnLine <= len) {
      progressOnLine += gapLeft

      if (dashLeft > 0) {
        progressOnLine += dashLeft
      } else {
        progressOnLine += dash
      }

      if (progressOnLine > len) {
        dashLeft = progressOnLine - len
        progressOnLine = len
      } else {
        dashLeft = 0
      }

      graphics.lineTo(p1x + progressOnLine * normalx, p1y + progressOnLine * normaly)

      progressOnLine += gap

      if (progressOnLine > len && dashLeft === 0) {
        gapLeft = progressOnLine - len
      } else {
        gapLeft = 0
        graphics.moveTo(p1x + progressOnLine * normalx, p1y + progressOnLine * normaly)
      }
    }
  }
}

const Grid = ({ game, updateGame }) => {
  const ref = useRef()
  const app = useRef()
  const cellElements = useRef([])
  const digitElements = useRef([])
  const centreMarkElements = useRef([])
  const cornerMarkElements = useRef([])
  const keyMetaPressed = useRef(false)
  const keyShiftPressed = useRef(false)

  const selectCell = useCallback((cell, append = false) => {
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
  }, [updateGame])

  const onKey = useCallback(e => {
    keyShiftPressed.current = e.shiftKey
    keyMetaPressed.current = e.metaKey
  }, [])

  const onKeyDown = useCallback(e => {
    onKey(e)

    let digit = e.code.match("Digit([1-9])")
    if (digit) {
      updateGame({
        type: TYPE_DIGITS,
        action: ACTION_SET,
        digit: +digit[1]
      })
      e.preventDefault()
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      updateGame({
        type: TYPE_DIGITS,
        action: ACTION_REMOVE
      })
    }
  }, [onKey, updateGame])

  const onKeyUp = useCallback(e => {
    onKey(e)
  }, [onKey])

  function onBackgroundClick(e) {
    e.stopPropagation()
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
    let cells = new PIXI.Container()

    newApp.stage.sortableChildren = true
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
        selection.zIndex = 5
        cell.addChild(selection)

        cell.on("pointerdown", function (e) {
          selectCell(this)
          e.stopPropagation()
        })

        cell.on("pointerover", function (e) {
          if (e.data.buttons === 1) {
            selectCell(this, true)
          }
          e.stopPropagation()
        })

        cells.addChild(cell)
        cellElements.current.push(cell)
      })
    })

    // render regions
    let flattedRegionOutlines = flatten(flatten(regions)).map(o => flatten(o))
    for (let outline of flattedRegionOutlines) {
      let poly = new PIXI.Graphics()
      poly.lineStyle({ width: 3, color: 0 })
      poly.drawPolygon(outline)
      poly.zIndex = 10
      grid.addChild(poly)
    }

    // render cages
    for (let cage of cages) {
      for (let outlines of cage.outlines) {
        for (let outline of outlines) {
          let poly = new PIXI.Graphics()
          let flattenedOutline = flatten(outline)
          let disposedOutline = disposePolygon(flattenedOutline, flattedRegionOutlines, 1)
          let shrunkenOutline = shrinkPolygon(disposedOutline, 3)
          poly.lineStyle({ width: 1, color: 0 })
          drawDashedPolygon(shrunkenOutline, 3, 2, poly)
          poly.zIndex = 1
          grid.addChild(poly)
        }
      }

      // create cage label
      // use larger font and scale down afterwards to improve text rendering
      let topleftText = new PIXI.Text(cage.value, {
        fontFamily: "Tahoma, Verdana, sans-serif",
        fontSize: 26
      })
      topleftText.zIndex = 3
      topleftText.x = cage.topleft[1] * CELL_SIZE + CELL_SIZE / 20
      topleftText.y = cage.topleft[0] * CELL_SIZE + CELL_SIZE / 60
      topleftText.scale.x = 0.5
      topleftText.scale.y = 0.5
      grid.addChild(topleftText)

      let topleftBg = new PIXI.Graphics()
      topleftBg.beginFill(0xffffff)
      topleftBg.drawRect(0, 0, topleftText.width + CELL_SIZE / 10 - 1, topleftText.height + CELL_SIZE / 60)
      topleftBg.endFill()
      topleftBg.zIndex = 2
      topleftBg.x = cage.topleft[1] * CELL_SIZE + 0.5
      topleftBg.y = cage.topleft[0] * CELL_SIZE + 0.5
      grid.addChild(topleftBg)
    }

    // create empty text elements for all digits
    data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let text = new PIXI.Text("", {
          fontFamily: "Tahoma, Verdana, sans-serif",
          fontSize: 40
        })
        text.zIndex = 10
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

    // create empty text elements for corner marks
    data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let cell = {
          data: {
            row: y,
            col: x
          },
          elements: []
        }

        let hcv = hasCageValue(x, y)

        for (let i = 0; i < 10; ++i) {
          let text = new PIXI.Text("", {
            fontFamily: "Tahoma, Verdana, sans-serif",
            fontSize: 26
          })

          text.zIndex = 10

          let cx = x * CELL_SIZE + CELL_SIZE / 2
          let cy = y * CELL_SIZE + CELL_SIZE / 2 - 0.5
          let mx = CELL_SIZE / 3.2
          let my = CELL_SIZE / 3.4

          switch (i) {
            case 0:
              if (hcv) {
                text.x = cx - mx / 3
                text.y = cy - my
              } else {
                text.x = cx - mx
                text.y = cy - my
              }
              break
            case 4:
              if (hcv) {
                text.x = cx + mx / 3
                text.y = cy - my
              } else {
                text.x = cx
                text.y = cy - my
              }
              break
            case 1:
              text.x = cx + mx
              text.y = cy - my
              break
            case 6:
              text.x = cx - mx
              text.y = cy
              break
            case 7:
              text.x = cx + mx
              text.y = cy
              break
            case 2:
              text.x = cx - mx
              text.y = cy + my
              break
            case 5:
              text.x = cx
              text.y = cy + my
              break
            case 3:
              text.x = cx + mx
              text.y = cy + my
              break
            case 8:
              text.x = cx - mx / 3
              text.y = cy + my
              break
            case 9:
              text.x = cx + mx / 3
              text.y = cy + my
              break
          }

          text.anchor.set(0.5)
          text.style.fill = BLUE_DIGIT
          text.scale.x = 0.5
          text.scale.y = 0.5

          grid.addChild(text)
          cell.elements.push(text)
        }

        cornerMarkElements.current.push(cell)
      })
    })

    // create empty text elements for centre marks
    data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let text = new PIXI.Text("", {
          fontFamily: "Tahoma, Verdana, sans-serif",
          fontSize: 28
        })
        text.zIndex = 10
        text.x = x * CELL_SIZE + CELL_SIZE / 2
        text.y = y * CELL_SIZE + CELL_SIZE / 2 - 0.5
        text.anchor.set(0.5)
        text.style.fill = BLUE_DIGIT
        text.scale.x = 0.5
        text.scale.y = 0.5
        text.data = {
          row: y,
          col: x
        }
        grid.addChild(text)
        centreMarkElements.current.push(text)
      })
    })

    grid.x = (newApp.screen.width - grid.width) / 2
    grid.y = (newApp.screen.height - grid.height) / 2

    grid.addChild(cells)
    newApp.stage.addChild(grid)

    let background = new PIXI.Graphics()
    background.hitArea = new PIXI.Rectangle(0, 0, newApp.screen.width, newApp.screen.height)
    background.drawRect(0, 0, newApp.screen.width, newApp.screen.height)
    background.interactive = true
    background.zIndex = -1000
    background.on("pointerdown", () => {
      updateGame({
        type: TYPE_SELECTION,
        action: ACTION_CLEAR
      })
    })
    newApp.stage.addChild(background)

    newApp.render()

    return () => {
      newApp.destroy({
        removeView: true
      })
      app.current = undefined
    }
  }, [selectCell, updateGame])

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
    let cornerMarks = []
    let centreMarks = []

    for (let e of cornerMarkElements.current) {
      let mark = game.cornerMarks.find(m => eqCell(m.data, e.data))
      for (let ce of e.elements) {
        ce.text = ""
      }
      if (mark !== undefined) {
        let compactedDigits = mark.digits.filter(Number.isInteger)
        for (let i = 0; i < compactedDigits.length; ++i) {
          let n = i
          if (compactedDigits.length > 8 && n > 4) {
            n++
          }
          e.elements[n].text = compactedDigits[i]
        }
        cornerMarks[mark.data.row] = cornerMarks[mark.data.row] || []
        cornerMarks[mark.data.row][mark.data.col] = e
      }
    }

    for (let e of centreMarkElements.current) {
      let mark = game.centreMarks.find(m => eqCell(m.data, e.data))
      if (mark !== undefined) {
        e.text = mark.digits.join("")
        centreMarks[mark.data.row] = centreMarks[mark.data.row] || []
        centreMarks[mark.data.row][mark.data.col] = e
      } else {
        e.text = ""
      }
    }

    for (let e of digitElements.current) {
      let digit = game.digits.find(d => eqCell(d.data, e.data))
      if (digit !== undefined) {
        e.text = digit.digit
        e.style.fill = digit.given ? 0 : BLUE_DIGIT

        if (cornerMarks[digit.data.row] !== undefined &&
            cornerMarks[digit.data.row][digit.data.col] !== undefined) {
          let cm = cornerMarks[digit.data.row][digit.data.col]
          for (let ce of cm.elements) {
            ce.text = ""
          }
        }
        if (centreMarks[digit.data.row] !== undefined &&
            centreMarks[digit.data.row][digit.data.col] !== undefined) {
          centreMarks[digit.data.row][digit.data.col].text = ""
        }
      } else {
        e.text = ""
      }
    }
    app.current.render()
  }, [game.digits, game.cornerMarks, game.centreMarks])

  return (
    <div ref={ref} className="grid" onClick={onBackgroundClick}>
      <style jsx>{styles}</style>
    </div>
  )
}

export default Grid
