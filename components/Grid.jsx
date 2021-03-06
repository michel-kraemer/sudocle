import GameContext from "./contexts/GameContext"
import SettingsContext from "./contexts/SettingsContext"
import { TYPE_DIGITS, TYPE_SELECTION, ACTION_CLEAR, ACTION_SET, ACTION_PUSH, ACTION_REMOVE } from "./lib/Actions"
import { xytok } from "./lib/utils"
import Color from "color"
import polygonClipping from "polygon-clipping"
import styles from "./Grid.scss"
import { useCallback, useContext, useEffect, useMemo, useRef } from "react"
import { flatten, forEachRight } from "lodash"

const SCALE_FACTOR = 1.2
const FONT_SIZE_DIGITS = 40
const FONT_SIZE_CORNER_MARKS_HIGH_DPI = 27
const FONT_SIZE_CORNER_MARKS_LOW_DPI = 28
const FONT_SIZE_CENTRE_MARKS_HIGH_DPI = 29
const FONT_SIZE_CENTRE_MARKS_LOW_DPI = 29

let PIXI
if (typeof window !== "undefined") {
  PIXI = require("pixi.js-legacy")
}

function unionCells(cells) {
  let polys = cells.map(cell => {
    let y = cell[0]
    let x = cell[1]
    return [[
      [x + 0, y + 0],
      [x + 1, y + 0],
      [x + 1, y + 1],
      [x + 0, y + 1]
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
  return unions.map(u => flatten(flatten(u)))
}

function hasCageValue(x, y, cages) {
  for (let cage of cages) {
    if (cage.topleft[0] === y && cage.topleft[1] === x &&
        cage.value !== undefined && cage.value !== "") {
      return true
    }
  }
  return false
}

function hasGivenCornerMarks(cell) {
  if (cell.pencilMarks === undefined) {
    return false
  }
  if (Array.isArray(cell.pencilMarks) && cell.pencilMarks.length === 0) {
    return false
  }
  return cell.pencilMarks !== ""
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

function isGrey(nColour) {
  let r = (nColour >> 16) & 0xff
  let g = (nColour >> 8) & 0xff
  let b = nColour & 0xff
  return r === g && r === b
}

// PIXI makes lines with round cap slightly longer. This function shortens them.
function shortenLine(points, delta = 3) {
  if (points.length <= 2) {
    return points
  }

  let firstPointX = points[0]
  let firstPointY = points[1]
  let secondPointX = points[2]
  let secondPointY = points[3]
  let lastPointX = points[points.length - 2]
  let lastPointY = points[points.length - 1]
  let secondToLastX = points[points.length - 4]
  let secondToLastY = points[points.length - 3]

  let dx = secondPointX - firstPointX
  let dy = secondPointY - firstPointY
  let l = Math.sqrt(dx * dx + dy * dy)
  dx /= l
  dy /= l
  firstPointX = firstPointX + dx * delta
  firstPointY = firstPointY + dy * delta

  dx = secondToLastX - lastPointX
  dy = secondToLastY - lastPointY
  l = Math.sqrt(dx * dx + dy * dy)
  dx /= l
  dy /= l
  lastPointX = lastPointX + dx * delta
  lastPointY = lastPointY + dy * delta

  return [firstPointX, firstPointY, ...points.slice(2, points.length - 2),
    lastPointX, lastPointY]
}

function makeCornerMarks(x, y, cellSize, fontSize, leaveRoom, n = 11, fontWeight = "normal") {
  let result = []

  for (let i = 0; i < n; ++i) {
    let text = new PIXI.Text("", {
      fontFamily: "Roboto, sans-serif",
      fontSize,
      fontWeight
    })

    text.data = {
      draw: function (cellSize) {
        let cx = x * cellSize + cellSize / 2
        let cy = y * cellSize + cellSize / 2 - 0.5
        let mx = cellSize / 3.2
        let my = cellSize / 3.4

        switch (i) {
          case 0:
            if (leaveRoom) {
              text.x = cx - mx / 3
              text.y = cy - my
            } else {
              text.x = cx - mx
              text.y = cy - my
            }
            break
          case 4:
            if (leaveRoom) {
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
      }
    }

    text.anchor.set(0.5)
    text.scale.x = 0.5
    text.scale.y = 0.5

    result.push(text)
  }

  return result
}

function getThemeColours(elem) {
  let rootStyle = window.getComputedStyle(elem)
  let backgroundColor = Color(rootStyle.getPropertyValue("--bg")).rgbNumber()
  let foregroundColor = Color(rootStyle.getPropertyValue("--fg")).rgbNumber()
  let digitColor = Color(rootStyle.getPropertyValue("--digit")).rgbNumber()
  let smallDigitColor = Color(rootStyle.getPropertyValue("--digit-small")).rgbNumber()

  let selectionYellow = Color(rootStyle.getPropertyValue("--selection-yellow")).rgbNumber()
  let selectionRed = Color(rootStyle.getPropertyValue("--selection-red")).rgbNumber()
  let selectionBlue = Color(rootStyle.getPropertyValue("--selection-blue")).rgbNumber()
  let selectionGreen = Color(rootStyle.getPropertyValue("--selection-green")).rgbNumber()

  return {
    backgroundColor,
    foregroundColor,
    digitColor,
    smallDigitColor,
    selection: {
      yellow: selectionYellow,
      red: selectionRed,
      green: selectionGreen,
      blue: selectionBlue
    }
  }
}

function drawBackground(graphics, width, height, themeColours) {
  graphics.hitArea = new PIXI.Rectangle(0, 0, width, height)
  graphics.beginFill(themeColours.backgroundColor)
  graphics.drawRect(0, 0, width, height)
  graphics.endFill()
}

function changeLineColour(graphicElements, colour) {
  for (let e of graphicElements) {
    for (let i = 0; i < e.geometry.graphicsData.length; ++i) {
      e.geometry.graphicsData[i].lineStyle.color = colour
    }
    e.geometry.invalidate()
  }
}

function cellToScreenCoords(cell, mx, my, cellSize) {
  return [cell[1] * cellSize + mx, cell[0] * cellSize + my]
}

function drawOverlay(overlay, mx, my, zIndex) {
  let r = new PIXI.Graphics()
  r.zIndex = zIndex

  let text
  let fontSize = overlay.fontSize || 20
  if (overlay.text !== undefined) {
    fontSize *= SCALE_FACTOR
    if (overlay.fontSize < 14) {
      fontSize *= (1 / 0.75)
    }
    text = new PIXI.Text(overlay.text, {
      fontFamily: "Roboto, sans-serif",
      fontSize
    })
    text.anchor.set(0.5)
    if (overlay.fontSize < 14) {
      text.scale.x = 0.75
      text.scale.y = 0.75
    }
    r.addChild(text)
  }

  r.data = {
    draw: function (cellSize, zoomFactor) {
      let center = cellToScreenCoords(overlay.center, mx, my, cellSize)
      r.x = center[0]
      r.y = center[1]

      if (text !== undefined) {
        text.style.fontSize = Math.round(fontSize * zoomFactor)
      }

      if (overlay.backgroundColor !== undefined || overlay.borderColor !== undefined) {
        let nBackgroundColour
        if (overlay.backgroundColor !== undefined) {
          nBackgroundColour = Color(overlay.backgroundColor).rgbNumber()
          r.beginFill(nBackgroundColour, isGrey(nBackgroundColour) ? 1 : 0.5)
        }
        if (overlay.borderColor !== undefined) {
          let nBorderColour = Color(overlay.borderColor).rgbNumber()
          if (nBorderColour !== nBackgroundColour &&
              !(overlay.width === 1 && overlay.height === 1 && isGrey(nBorderColour))) {
            r.lineStyle({
              width: 2,
              color: nBorderColour,
              alpha: isGrey(nBorderColour) ? 1 : 0.5,
              alignment: 0
            })
          }
        }
        let w = overlay.width * cellSize
        let h = overlay.height * cellSize
        if (overlay.rounded) {
          if (w === h) {
            r.drawEllipse(0, 0, w / 2, h / 2)
          } else {
            r.drawRoundedRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2 - 1)
          }
        } else {
          r.drawRect(-w / 2, -h / 2, w, h)
        }
        if (overlay.backgroundColor !== undefined) {
          r.endFill()
        }
      }
    }
  }

  return r
}

const Grid = ({ maxWidth, maxHeight, portrait, onFinishRender }) => {
  const ref = useRef()
  const app = useRef()
  const gridElement = useRef()
  const cellsElement = useRef()
  const allElement = useRef()
  const cellElements = useRef([])
  const regionElements = useRef([])
  const cageElements = useRef([])
  const cageLabelTextElements = useRef([])
  const cageLabelBackgroundElements = useRef([])
  const lineElements = useRef([])
  const arrowHeadElements = useRef([])
  const underlayElements = useRef([])
  const overlayElements = useRef([])
  const backgroundElement = useRef()
  const givenCornerMarkElements = useRef([])
  const digitElements = useRef([])
  const centreMarkElements = useRef([])
  const cornerMarkElements = useRef([])
  const colourElements = useRef([])
  const selectionElements = useRef([])
  const errorElements = useRef([])

  const game = useContext(GameContext.State)
  const updateGame = useContext(GameContext.Dispatch)
  const settings = useContext(SettingsContext.State)

  const cellSize = game.data.cellSize * SCALE_FACTOR
  const cellSizeFactor = useRef(1)

  const regions = useMemo(() => flatten(game.data.regions.map(region => {
    return unionCells(region)
  })), [game.data])

  const cages = useMemo(() => flatten(game.data.cages
    .filter(cage => cage.cells?.length)
    .map(cage => {
      let unions = unionCells(cage.cells)
      return unions.map(union => {
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
          outline: union,
          value: cage.value,
          topleft
        }
      })
    })), [game.data])

  const selectCell = useCallback((cell, evt, append = false) => {
    let action = append ? ACTION_PUSH : ACTION_SET
    let oe = evt?.data?.originalEvent
    if (oe?.metaKey || oe?.ctrlKey) {
      if (oe?.shiftKey) {
        action = ACTION_REMOVE
      } else {
        action = ACTION_PUSH
      }
    }
    updateGame({
      type: TYPE_SELECTION,
      action,
      k: cell.data.k
    })
  }, [updateGame])

  const onKeyDown = useCallback(e => {
    let digit = e.code.match("Digit([0-9])")
    if (digit) {
      let nd = +digit[1]
      updateGame({
        type: TYPE_DIGITS,
        action: ACTION_SET,
        digit: nd
      })
      e.preventDefault()
    }

    let numpad = e.code.match("Numpad([0-9])")
    if (numpad && +e.key === +numpad[1]) {
      let nd = +numpad[1]
      updateGame({
        type: TYPE_DIGITS,
        action: ACTION_SET,
        digit: nd
      })
      e.preventDefault()
    }

    if (e.key === "Backspace" || e.key === "Delete" || e.key === "Clear") {
      updateGame({
        type: TYPE_DIGITS,
        action: ACTION_REMOVE
      })
    }
  }, [updateGame])

  function onBackgroundClick(e) {
    e.stopPropagation()
  }

  function onDoubleClick(e) {
    if (game.selection.size === 0 || !e.altKey) {
      return
    }

    // get color of last cell clicked
    let last = [...game.selection].pop()
    let colour = game.colours.get(last)

    if (colour !== undefined) {
      // find all cells with the same colour
      let allCells = []
      for (let [k, c] of game.colours) {
        if (c.colour === colour.colour) {
          allCells.push(k)
        }
      }

      let action = (e.metaKey || e.ctrlKey) ? ACTION_PUSH : ACTION_SET
      updateGame({
        type: TYPE_SELECTION,
        action,
        k: allCells
      })
    }
  }

  const onTouchMove = useCallback((e) => {
    let touch = e.touches[0]
    let x = touch.pageX
    let y = touch.pageY
    let interactionManager = app.current.renderer.plugins.interaction
    let p = {}
    interactionManager.mapPositionToPoint(p, x, y)
    let hit = interactionManager.hitTest(p, cellsElement.current)
    if (hit?.data?.k !== undefined) {
      selectCell(hit, e, true)
    }
  }, [selectCell])

  useEffect(() => {
    // optimised resolution for different screens
    let resolution = Math.min(window.devicePixelRatio,
      window.devicePixelRatio === 2 ? 3 : 2.5)

    // create PixiJS app
    let newApp = new PIXI.Application({
      resolution,
      antialias: true,
      transparent: false,
      autoDensity: true,
      autoStart: false
    })
    ref.current.appendChild(newApp.view)
    app.current = newApp

    // it seems we don't need the system ticker, so stop it
    PIXI.Ticker.system.stop()

    // good for dpi < 2
    if (window.devicePixelRatio < 2) {
      PIXI.settings.ROUND_PIXELS = true
    }

    // register touch handler
    newApp.view.addEventListener("touchmove", onTouchMove)

    let themeColours = getThemeColours(ref.current)

    let fontSizeCageLabels = 26

    // create grid
    let all = new PIXI.Container()
    allElement.current = all
    let grid = new PIXI.Container()
    gridElement.current = grid
    let cells = new PIXI.Container()
    cellsElement.current = cells

    all.sortableChildren = true
    grid.sortableChildren = true

    // ***************** Layers and zIndexes:

    // all                            sortable
    //   background            -1000
    //   underlays               -10
    //   lines and arrows         -1
    //   arrow heads              -1
    //   colour                    0
    //   errors                   10
    //   selection                20
    //   grid                     30  sortable
    //     region                 10
    //     cage outline            1
    //     cage label              3
    //     cage label background   2
    //     cells
    //       cell                  0
    //   overlays                 40
    //   given corner marks       41
    //   digit                    50
    //   corner marks             50
    //   centre marks             50

    // ***************** render everything that could contribute to bounds

    // render cells
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let cell = new PIXI.Graphics()
        cell.interactive = true
        cell.buttonMode = true

        cell.data = {
          k: xytok(x, y),
          draw: function (cellSize) {
            cell.lineStyle({ width: 1, color: themeColours.foregroundColor })
            cell.drawRect(0, 0, cellSize, cellSize)

            cell.x = x * cellSize
            cell.y = y * cellSize

            // since our cells have a transparent background, we need to
            // define a hit area
            cell.hitArea = new PIXI.Rectangle(0, 0, cellSize, cellSize)
          }
        }

        cell.on("pointerdown", function (e) {
          selectCell(this, e)
          e.stopPropagation()
          e.data.originalEvent.preventDefault()
        })

        cell.on("pointerover", function (e) {
          if (e.data.buttons === 1) {
            selectCell(this, e, true)
          }
          e.stopPropagation()
        })

        cells.addChild(cell)
        cellElements.current.push(cell)
      })
    })

    // render regions
    for (let r of regions) {
      let poly = new PIXI.Graphics()
      poly.data = {
        draw: function (cellSize) {
          poly.lineStyle({ width: 3, color: themeColours.foregroundColor })
          poly.drawPolygon(r.map(v => v * cellSize))
        }
      }
      poly.zIndex = 10
      grid.addChild(poly)
      regionElements.current.push(poly)
    }

    // render cages
    for (let cage of cages) {
      // draw outline
      let poly = new PIXI.Graphics()
      poly.zIndex = 1
      poly.data = {
        draw: function (cellSize) {
          let disposedOutline = disposePolygon(cage.outline.map(v => v * cellSize),
            regions.map(rarr => rarr.map(v => v * cellSize)), 1)
          let shrunkenOutline = shrinkPolygon(disposedOutline, 3)
          poly.lineStyle({ width: 1, color: themeColours.foregroundColor })
          drawDashedPolygon(shrunkenOutline, 3, 2, poly)
        }
      }
      grid.addChild(poly)
      cageElements.current.push(poly)

      if (cage.value !== undefined && cage.value.trim() !== "") {
        // create cage label
        // use larger font and scale down afterwards to improve text rendering
        let topleftText = new PIXI.Text(cage.value, {
          fontFamily: "Roboto, sans-serif",
          fontSize: fontSizeCageLabels
        })
        topleftText.zIndex = 3
        topleftText.scale.x = 0.5
        topleftText.scale.y = 0.5
        topleftText.data = {
          draw: function (cellSize) {
            topleftText.x = cage.topleft[1] * cellSize + cellSize / 20
            topleftText.y = cage.topleft[0] * cellSize + cellSize / 60
          }
        }
        grid.addChild(topleftText)
        cageLabelTextElements.current.push(topleftText)

        let topleftBg = new PIXI.Graphics()
        topleftBg.zIndex = 2
        topleftBg.data = {
          draw: function (cellSize) {
            topleftBg.beginFill(0xffffff)
            topleftBg.drawRect(0, 0, topleftText.width + cellSize / 10 - 1,
                topleftText.height + cellSize / 60)
            topleftBg.endFill()
            topleftBg.x = cage.topleft[1] * cellSize + 0.5
            topleftBg.y = cage.topleft[0] * cellSize + 0.5
          }
        }
        grid.addChild(topleftBg)
        cageLabelBackgroundElements.current.push(topleftBg)
      }
    }

    grid.addChild(cells)
    grid.zIndex = 30
    all.addChild(grid)

    // add lines and arrows
    forEachRight(game.data.lines.concat(game.data.arrows), line => {
      let poly = new PIXI.Graphics()
      poly.zIndex = -1
      poly.data = {
        draw: function (cellSize) {
          let points = shortenLine(flatten(line.wayPoints.map(wp =>
              cellToScreenCoords(wp, grid.x, grid.y, cellSize))))
          poly.lineStyle({
            width: line.thickness * SCALE_FACTOR,
            color: Color(line.color).rgbNumber(),
            cap: PIXI.LINE_CAP.ROUND,
            join: PIXI.LINE_JOIN.ROUND
          })
          poly.moveTo(points[0], points[1])
          for (let i = 2; i < points.length; i += 2) {
            poly.lineTo(points[i], points[i + 1])
          }
        }
      }
      all.addChild(poly)
      lineElements.current.push(poly)
    })

    // add arrow heads
    game.data.arrows.forEach(arrow => {
      if (arrow.wayPoints.length <= 1) {
        return
      }
      let poly = new PIXI.Graphics()
      poly.zIndex = -1
      poly.data = {
        draw: function (cellSize) {
          let points = shortenLine(flatten(arrow.wayPoints.map(wp =>
              cellToScreenCoords(wp, grid.x, grid.y, cellSize))), arrow.thickness)
          let lastPointX = points[points.length - 2]
          let lastPointY = points[points.length - 1]
          let secondToLastX = points[points.length - 4]
          let secondToLastY = points[points.length - 3]
          let dx = lastPointX - secondToLastX
          let dy = lastPointY - secondToLastY
          let l = Math.sqrt(dx * dx + dy * dy)
          dx /= l
          dy /= l
          let f = Math.min(arrow.headLength * cellSize * 0.7, l / 3)
          let ex = lastPointX - dx * f
          let ey = lastPointY - dy * f
          let ex1 = ex - dy * f
          let ey1 = ey + dx * f
          let ex2 = ex + dy * f
          let ey2 = ey - dx * f
          poly.lineStyle({
            width: arrow.thickness * SCALE_FACTOR,
            color: Color(arrow.color).rgbNumber(),
            cap: PIXI.LINE_CAP.ROUND,
            join: PIXI.LINE_JOIN.ROUND
          })
          poly.moveTo(lastPointX, lastPointY)
          poly.lineTo(ex1, ey1)
          poly.moveTo(lastPointX, lastPointY)
          poly.lineTo(ex2, ey2)
        }
      }
      all.addChild(poly)
      arrowHeadElements.current.push(poly)
    })

    // add underlays and overlays
    game.data.underlays.forEach(underlay => {
      let e = drawOverlay(underlay, grid.x, grid.y, -10)
      all.addChild(e)
      underlayElements.current.push(e)
    })
    game.data.overlays.forEach(overlay => {
      let e = drawOverlay(overlay, grid.x, grid.y, 40)
      all.addChild(e)
      overlayElements.current.push(e)
    })

    // draw a background that covers all elements
    let background = new PIXI.Graphics()
    background.interactive = true
    background.zIndex = -1000
    background.on("pointerdown", () => {
      updateGame({
        type: TYPE_SELECTION,
        action: ACTION_CLEAR
      })
    })
    backgroundElement.current = background

    app.current.stage.addChild(background)
    app.current.stage.addChild(all)

    // ***************** draw other elements that don't contribute to the bounds

    // create text elements for given corner marks
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let arr = col.pencilMarks
        if (arr === undefined) {
          return
        }
        if (!Array.isArray(arr)) {
          arr = [arr]
        }

        let hcv = hasCageValue(x, y, cages)
        let cms = makeCornerMarks(x, y, cellSize, FONT_SIZE_CORNER_MARKS_HIGH_DPI,
            hcv, arr.length, "bold")
        cms.forEach((cm, i) => {
          cm.zIndex = 41
          cm.style.fill = themeColours.foregroundColor
          cm.text = arr[i]
          all.addChild(cm)
          givenCornerMarkElements.current.push(cm)
        })
      })
    })

    // ***************** draw invisible elements but don't call render() again!

    // create empty text elements for all digits
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let text = new PIXI.Text("", {
          fontFamily: "Roboto, sans-serif",
          fontSize: FONT_SIZE_DIGITS
        })
        text.visible = false
        text.zIndex = 50
        text.anchor.set(0.5)
        text.data = {
          k: xytok(x, y),
          draw: function (cellSize) {
            text.x = x * cellSize + cellSize / 2
            text.y = y * cellSize + cellSize / 2 - 0.5
          }
        }
        all.addChild(text)
        digitElements.current.push(text)
      })
    })

    // create empty text elements for corner marks
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let cell = {
          data: {
            k: xytok(x, y)
          },
          elements: []
        }

        let leaveRoom = hasCageValue(x, y, cages) || hasGivenCornerMarks(col)
        let cms = makeCornerMarks(x, y, cellSize, FONT_SIZE_CORNER_MARKS_HIGH_DPI,
            leaveRoom, 11)
        for (let cm of cms) {
          cm.visible = false
          cm.zIndex = 50
          cm.style.fill = themeColours.digitColor
          all.addChild(cm)
          cell.elements.push(cm)
        }

        cornerMarkElements.current.push(cell)
      })
    })

    // create empty text elements for centre marks
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let text = new PIXI.Text("", {
          fontFamily: "Roboto, sans-serif",
          fontSize: FONT_SIZE_CENTRE_MARKS_HIGH_DPI
        })
        text.zIndex = 50
        text.anchor.set(0.5)
        text.style.fill = themeColours.digitColor
        text.scale.x = 0.5
        text.scale.y = 0.5
        text.visible = false
        text.data = {
          k: xytok(x, y),
          draw: function (cellSize) {
            text.x = x * cellSize + cellSize / 2
            text.y = y * cellSize + cellSize / 2 - 0.5
          }
        }
        all.addChild(text)
        centreMarkElements.current.push(text)
      })
    })

    // create invisible rectangles for colours
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let rect = new PIXI.Graphics()
        rect.alpha = 0
        rect.zIndex = 0
        rect.data = {
          k: xytok(x, y),
          draw: function (cellSize) {
            rect.x = x * cellSize
            rect.y = y * cellSize
          }
        }
        all.addChild(rect)
        colourElements.current.push(rect)
      })
    })

    // create invisible rectangles for selection
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let rect = new PIXI.Graphics()
        rect.visible = false
        rect.zIndex = 20
        rect.data = {
          k: xytok(x, y),
          draw: function (cellSize) {
            rect.beginFill(0xffde2a, 0.5)
            rect.drawRect(0.5, 0.5, cellSize - 1, cellSize - 1)
            rect.endFill()
            rect.x = x * cellSize
            rect.y = y * cellSize
          }
        }
        all.addChild(rect)
        selectionElements.current.push(rect)
      })
    })

    // create invisible rectangles for errors
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let rect = new PIXI.Graphics()
        rect.visible = false
        rect.zIndex = 10
        rect.data = {
          k: xytok(x, y),
          draw: function (cellSize) {
            rect.beginFill(0xb33a3a, 0.5)
            rect.drawRect(0.5, 0.5, cellSize - 1, cellSize - 1)
            rect.endFill()
            rect.x = x * cellSize
            rect.y = y * cellSize
          }
        }
        all.addChild(rect)
        errorElements.current.push(rect)
      })
    })

    if (onFinishRender) {
      onFinishRender()
    }

    return () => {
      allElement.current = undefined
      gridElement.current = undefined
      cellsElement.current = undefined
      cellElements.current = []
      regionElements.current = []
      cageElements.current = []
      cageLabelTextElements.current = []
      cageLabelBackgroundElements.current = []
      lineElements.current = []
      arrowHeadElements.current = []
      underlayElements.current = []
      overlayElements.current = []
      givenCornerMarkElements.current = []
      digitElements.current = []
      centreMarkElements.current = []
      cornerMarkElements.current = []
      colourElements.current = []
      selectionElements.current = []
      errorElements.current = []

      newApp.view.removeEventListener("touchmove", onTouchMove)
      newApp.destroy(true, true)
      app.current = undefined
    }
  }, [game.data, cellSize, regions, cages, selectCell, updateGame,
      onFinishRender, onTouchMove])

  useEffect(() => {
    let cs = cellSize * settings.zoom
    let allBounds
    let gridBounds

    cellSizeFactor.current = settings.zoom
    allElement.current.x = allElement.current.y = 0

    for (let i = 0; i < 10; ++i) {
      let elementsToRedraw = [cellElements, regionElements, cageElements,
        cageLabelTextElements, cageLabelBackgroundElements, lineElements, arrowHeadElements,
        underlayElements, overlayElements, givenCornerMarkElements, digitElements,
        centreMarkElements, colourElements, selectionElements, errorElements]
      for (let r of elementsToRedraw) {
        for (let e of r.current) {
          if (e.clear !== undefined) {
            e.clear()
          }
          e.data.draw(cs, cellSizeFactor.current)
        }
      }
      for (let e of cornerMarkElements.current) {
        for (let ce of e.elements) {
          ce.data.draw(cs)
        }
      }

      allElement.current.calculateBounds()
      allBounds = allElement.current.getBounds()
      gridBounds = gridElement.current.getBounds()

      // Align bounds to pixels. This makes sure the grid is always sharp
      // and lines do not sit between pixels.
      let gx1 = gridBounds.x
      let gy1 = gridBounds.y
      let mx1 = gx1 - allBounds.x
      let my1 = gy1 - allBounds.y
      let gx2 = gx1 + gridBounds.width
      let gy2 = gy1 + gridBounds.height
      let ax2 = allBounds.x + allBounds.width
      let ay2 = allBounds.y + allBounds.height
      let mx2 = ax2 - gx2
      let my2 = ay2 - gy2
      let ax2b = gx2 + Math.ceil(mx2)
      let ay2b = gy2 + Math.ceil(my2)
      allBounds.x = gx1 - Math.ceil(mx1)
      allBounds.y = gy1 - Math.ceil(my1)
      allBounds.width = ax2b - allBounds.x
      allBounds.height = ay2b - allBounds.y

      if (allBounds.width <= maxWidth && allBounds.height <= maxHeight) {
        break
      }

      // leave 5 pixels of leeway for rounding errors
      let sx = (maxWidth - 5) / allBounds.width
      let sy = (maxHeight - 5) / allBounds.height
      cellSizeFactor.current = Math.min(sx, sy) * settings.zoom
      cs = Math.floor(cellSize * cellSizeFactor.current)
    }

    let marginTop = gridBounds.y - allBounds.y
    let marginBottom = allBounds.y + allBounds.height -
      (gridBounds.y + gridBounds.height)
    let marginLeft = gridBounds.x - allBounds.x
    let marginRight = allBounds.x + allBounds.width -
      (gridBounds.x + gridBounds.width)
    let additionalMarginX = 0
    let additionalMarginY = 0
    if (portrait) {
      additionalMarginX = Math.abs(marginLeft - marginRight)
    } else {
      additionalMarginY = Math.abs(marginTop - marginBottom)
    }

    let w = allBounds.width
    let h = allBounds.height

    app.current.renderer.resize(w, h)
    allElement.current.x = -allBounds.x
    allElement.current.y = -allBounds.y

    if (marginTop > marginBottom) {
      ref.current.style.marginTop = "0"
      ref.current.style.marginBottom = `${additionalMarginY}px`
    } else {
      ref.current.style.marginTop = `${additionalMarginY}px`
      ref.current.style.marginBottom = "0"
    }
    if (marginLeft > marginRight) {
      ref.current.style.marginLeft = "0"
      ref.current.style.marginRight = `${additionalMarginX}px`
    } else {
      ref.current.style.marginLeft = `${additionalMarginX}px`
      ref.current.style.marginRight = "0"
    }
  }, [cellSize, maxWidth, maxHeight, portrait, settings.zoom])

  // register keyboard handlers
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [onKeyDown])

  useEffect(() => {
    let themeColours = getThemeColours(ref.current)

    // optimised font sizes for different screens
    let fontSizeCornerMarks = window.devicePixelRatio >= 2 ?
        FONT_SIZE_CORNER_MARKS_HIGH_DPI : FONT_SIZE_CORNER_MARKS_LOW_DPI
    let fontSizeCentreMarks = window.devicePixelRatio >= 2 ?
        FONT_SIZE_CENTRE_MARKS_HIGH_DPI : FONT_SIZE_CENTRE_MARKS_LOW_DPI

    // scale fonts
    let fontSizeDigits = FONT_SIZE_DIGITS * settings.fontSizeFactorDigits
    fontSizeCornerMarks *= settings.fontSizeFactorCornerMarks
    fontSizeCentreMarks *= settings.fontSizeFactorCentreMarks

    // change font size of digits
    for (let e of digitElements.current) {
      e.style.fontSize = Math.round(fontSizeDigits * cellSizeFactor.current)
    }

    // change font size of corner marks
    for (let e of cornerMarkElements.current) {
      for (let ce of e.elements) {
        ce.style.fontSize = Math.round(fontSizeCornerMarks * cellSizeFactor.current)
      }
    }

    // change font size of centre marks
    for (let e of centreMarkElements.current) {
      e.style.fontSize = Math.round(fontSizeCentreMarks * cellSizeFactor.current)
    }

    // change font size and colour of given corner marks
    for (let e of givenCornerMarkElements.current) {
      e.style.fontSize = Math.round(fontSizeCornerMarks * cellSizeFactor.current)
      e.style.fill = themeColours.foregroundColor
    }

    // change selection colour
    for (let e of selectionElements.current) {
      e.geometry.graphicsData[0].fillStyle.color =
        themeColours.selection[settings.selectionColour]
      e.geometry.invalidate()
    }

    // change line colour of cells, regions, cages
    changeLineColour(cellElements.current, themeColours.foregroundColor)
    changeLineColour(regionElements.current, themeColours.foregroundColor)
    changeLineColour(cageElements.current, themeColours.foregroundColor)

    // change background colour
    backgroundElement.current.clear()
    drawBackground(backgroundElement.current, app.current.renderer.width,
      app.current.renderer.height, themeColours)
  }, [settings.theme, settings.selectionColour, settings.zoom, settings.fontSizeFactorDigits,
      settings.fontSizeFactorCentreMarks, settings.fontSizeFactorCornerMarks,
      maxWidth, maxHeight, portrait])

  useEffect(() => {
    selectionElements.current.forEach(s => {
      s.visible = game.selection.has(s.data.k)
    })
    app.current.render()
  }, [game.selection])

  useEffect(() => {
    let themeColours = getThemeColours(ref.current)
    let cornerMarks = new Map()
    let centreMarks = new Map()

    for (let e of cornerMarkElements.current) {
      let digits = game.cornerMarks.get(e.data.k)
      for (let ce of e.elements) {
        ce.visible = false
      }
      if (digits !== undefined) {
        [...digits].sort().forEach((d, i) => {
          let n = i
          if (digits.size > 8 && n > 4) {
            n++
          }
          e.elements[n].text = d
          e.elements[n].style.fill = themeColours.smallDigitColor
          e.elements[n].visible = true
        })
        cornerMarks.set(e.data.k, e)
      }
    }

    for (let e of centreMarkElements.current) {
      let digits = game.centreMarks.get(e.data.k)
      if (digits !== undefined) {
        e.text = [...digits].sort().join("")
        e.style.fill = themeColours.smallDigitColor
        e.visible = true
        centreMarks.set(e.data.k, e)
      } else {
        e.visible = false
      }
    }

    for (let e of digitElements.current) {
      let digit = game.digits.get(e.data.k)
      if (digit !== undefined) {
        e.text = digit.digit
        e.style.fill = digit.given ? themeColours.foregroundColor : themeColours.digitColor
        e.visible = true

        let com = cornerMarks.get(e.data.k)
        if (com !== undefined) {
          for (let ce of com.elements) {
            ce.visible = false
          }
        }

        let cem = centreMarks.get(e.data.k)
        if (cem !== undefined) {
          cem.visible = false
        }
      } else {
        e.visible = false
      }
    }

    let scaledCellSize = Math.floor(cellSize * cellSizeFactor.current)
    let colourPalette = settings.colourPalette
    if (colourPalette === "custom" && settings.customColours.length === 0) {
      colourPalette = "default"
    }
    let colours = []
    if (colourPalette !== "custom") {
      let computedStyle = getComputedStyle(ref.current)
      let nColours = +computedStyle.getPropertyValue("--colors")
      for (let i = 0; i < nColours; ++i) {
        colours[i] = computedStyle.getPropertyValue(`--color-${i + 1}`)
      }
    } else {
      colours = settings.customColours
    }
    for (let e of colourElements.current) {
      let colour = game.colours.get(e.data.k)
      if (colour !== undefined) {
        let palCol = colours[colour.colour - 1]
        if (palCol === undefined) {
          palCol = colours[1] || colours[0]
        }
        let colourNumber = Color(palCol).rgbNumber()
        e.clear()
        e.beginFill(colourNumber)
        e.drawRect(0.5, 0.5, scaledCellSize - 1, scaledCellSize - 1)
        e.endFill()
        if (colourNumber === 0xffffff) {
          e.alpha = 1.0
        } else {
          e.alpha = 0.5
        }
      } else {
        e.alpha = 0
      }
    }

    for (let e of errorElements.current) {
      e.visible = game.errors.has(e.data.k)
    }

    app.current.render()
  }, [cellSize, game.digits, game.cornerMarks, game.centreMarks, game.colours,
      game.errors, settings.theme, settings.colourPalette, settings.selectionColour,
      settings.customColours, settings.zoom, settings.fontSizeFactorDigits,
      settings.fontSizeFactorCentreMarks, settings.fontSizeFactorCornerMarks,
      maxWidth, maxHeight, portrait])

  return (
    <div ref={ref} className="grid" onClick={onBackgroundClick} onDoubleClick={onDoubleClick}>
      <style jsx>{styles}</style>
    </div>
  )
}

export default Grid
