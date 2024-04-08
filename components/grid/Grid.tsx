import {
  Dispatch as GameContextDispatch,
  State as GameContextState,
} from "../contexts/GameContext"
import { useAsyncEffect } from "../hooks/useAsyncEffect"
import { useSettings } from "../hooks/useSettings"
import {
  ACTION_CLEAR,
  ACTION_PUSH,
  ACTION_REMOVE,
  ACTION_SET,
  PenLinesAction,
  SelectionAction,
  TYPE_DIGITS,
  TYPE_PENLINES,
  TYPE_SELECTION,
} from "../lib/Actions"
import { MODE_PEN } from "../lib/Modes"
import { hasFog, ktoxy, pltok, xytok } from "../lib/utils"
import { Arrow, DataCell, FogLight, Line, Overlay } from "../types/Data"
import { Digit } from "../types/Game"
import Cell from "./Cell"
import { GraphicsEx } from "./GraphicsEx"
import { ThemeColours } from "./ThemeColours"
import Color from "color"
import { produce } from "immer"
import { flatten, isEqual } from "lodash"
import memoizeOne from "memoize-one"
import { DropShadowFilter } from "pixi-filters/drop-shadow"
import {
  Application,
  Bounds,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyleFontWeight,
  Ticker,
} from "pixi.js"
import polygonClipping, { Polygon } from "polygon-clipping"
import {
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react"
import { useShallow } from "zustand/react/shallow"

const SCALE_FACTOR = 1.2
const ZOOM_DELTA = 0.05
const FONT_SIZE_DIGITS = 40
const FONT_SIZE_CORNER_MARKS_HIGH_DPI = 27
const FONT_SIZE_CORNER_MARKS_LOW_DPI = 28
const FONT_SIZE_CENTRE_MARKS_HIGH_DPI = 29
const FONT_SIZE_CENTRE_MARKS_LOW_DPI = 29
const MAX_RENDER_LOOP_TIME = 500

const PENLINE_TYPE_CENTER_RIGHT = 0
const PENLINE_TYPE_CENTER_DOWN = 1
const PENLINE_TYPE_EDGE_RIGHT = 2
const PENLINE_TYPE_EDGE_DOWN = 3

// TODO remove
interface OldGraphicsExData {
  k?: number
  borderColor?: number | undefined
  draw: (options: {
    cellSize: number
    zoomFactor: number
    currentDigits: Map<number, Digit>
    currentFogLights: FogLight[] | undefined
    currentFogRaster: number[][] | undefined
    themeColours: ThemeColours
  }) => void
}

interface OldWithGraphicsExData {
  data?: OldGraphicsExData
}

// TODO remove
type OldGraphicsEx = Graphics & OldWithGraphicsExData

// TODO remove
type OldTextEx = Text & OldWithGraphicsExData

// TODO remove
type OldSpriteEx = Sprite & OldWithGraphicsExData

// TODO remove
function wrapOld(g: GraphicsEx): OldWithGraphicsExData {
  return {
    data: {
      k: g.k,
      borderColor: g.borderColor,
      draw: options => {
        g.draw(options)
      },
    },
  }
}

type PenWaypointGraphics = Graphics & {
  data?: {
    cellSize?: number
    draw: (options: {
      cellSize?: number
      penCurrentWaypoints: number[]
    }) => void
  }
}

interface CornerMarkElement {
  data: {
    k: number
  }
  elements: OldTextEx[]
}

interface GridCage {
  outline: number[]
  value?: number | string
  borderColor?: string
  topleft: [number, number]
}

function unionCells(cells: [number, number][]): number[][][] {
  let polys = cells.map(cell => {
    let y = cell[0]
    let x = cell[1]
    let r: Polygon = [
      [
        [x + 0, y + 0],
        [x + 1, y + 0],
        [x + 1, y + 1],
        [x + 0, y + 1],
      ],
    ]
    return r
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

  // merge holes into outer polygon if there is a shared point
  for (let u of unions) {
    let hi = 1
    while (hi < u.length) {
      let hole = u[hi]
      for (let spi = 0; spi < hole.length; ++spi) {
        let ph = hole[spi]
        let sharedPoint = u[0].findIndex(
          pu => pu[0] === ph[0] && pu[1] === ph[1],
        )
        if (sharedPoint >= 0) {
          // we found a shared point - merge hole into outer polygon
          u[0] = [
            ...u[0].slice(0, sharedPoint),
            ...hole.slice(spi),
            ...hole.slice(0, spi),
            ...u[0].slice(sharedPoint),
          ]

          // delete merged hole
          u.splice(hi, 1)
          --hi
          break
        }
      }
      ++hi
    }
  }

  return unions.map(u => u.map(u2 => flatten(u2)))
}

function hasCageValue(x: number, y: number, cages: GridCage[]): boolean {
  for (let cage of cages) {
    if (
      cage.topleft[0] === y &&
      cage.topleft[1] === x &&
      cage.value !== undefined &&
      cage.value !== ""
    ) {
      return true
    }
  }
  return false
}

function hasGivenCornerMarks(cell: DataCell): boolean {
  if (cell.pencilMarks === undefined) {
    return false
  }
  if (Array.isArray(cell.pencilMarks) && cell.pencilMarks.length === 0) {
    return false
  }
  return cell.pencilMarks !== ""
}

// shrink polygon inwards by distance `d`
function shrinkPolygon(points: number[], d: number): number[] {
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
function disposePolygon(
  points: number[],
  otherPolygons: number[][],
  d: number,
): number[] {
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
        if (
          o1x === o2x &&
          p1x === o1x &&
          p2x === o2x &&
          ((o1y <= p1y && o2y >= p1y) || (o1y <= p2y && o2y >= p2y))
        ) {
          result[i] = p1x + d * sx
          result[(i + 2) % points.length] = p2x + d * sx
          disposed = true
          break
        }
        if (
          o1y === o2y &&
          p1y === o1y &&
          p2y === o2y &&
          ((o1x <= p1x && o2x >= p1x) || (o1x <= p2x && o2x >= p2x))
        ) {
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
function drawDashedPolygon(
  points: number[],
  dash: number,
  gap: number,
  graphics: Graphics,
) {
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

      graphics.lineTo(
        p1x + progressOnLine * normalx,
        p1y + progressOnLine * normaly,
      )

      progressOnLine += gap

      if (progressOnLine > len && dashLeft === 0) {
        gapLeft = progressOnLine - len
      } else {
        gapLeft = 0
        graphics.moveTo(
          p1x + progressOnLine * normalx,
          p1y + progressOnLine * normaly,
        )
      }
    }
  }
}

function isGrey(nColour: number): boolean {
  let r = (nColour >> 16) & 0xff
  let g = (nColour >> 8) & 0xff
  let b = nColour & 0xff
  return r === g && r === b
}

function isReverseEqual(a: [number, number][], b: [number, number][]): boolean {
  if (a.length !== b.length) {
    return false
  }
  let ai = 0
  let bi = b.length - 1
  while (ai < a.length) {
    if (a[ai][0] !== b[bi][0] || a[ai][1] !== b[bi][1]) {
      return false
    }
    ai++
    bi--
  }
  return true
}

// do not shorten connected lines of same colour and thickness
function needsLineShortening(
  line: Line,
  allLines: Line[],
): { shortenStart: boolean; shortenEnd: boolean } {
  if (line.wayPoints.length < 2) {
    return { shortenStart: false, shortenEnd: false }
  }
  let shortenStart = true
  let shortenEnd = true
  let first = line.wayPoints[0]
  let last = line.wayPoints[line.wayPoints.length - 1]
  for (let o of allLines) {
    if (
      isEqual(o.wayPoints, line.wayPoints) ||
      isReverseEqual(o.wayPoints, line.wayPoints) ||
      o.wayPoints.length === 0 ||
      line.thickness !== o.thickness ||
      line.color !== o.color
    ) {
      continue
    }
    if (shortenStart && o.wayPoints.some(p => isEqual(first, p))) {
      shortenStart = false
    }
    if (shortenEnd && o.wayPoints.some(p => isEqual(last, p))) {
      shortenEnd = false
    }
    if (!shortenStart && !shortenEnd) {
      break
    }
  }
  return { shortenStart, shortenEnd }
}

// PIXI makes lines with round cap slightly longer. This function shortens them.
function shortenLine(
  points: number[],
  shortenStart: boolean,
  shortenEnd: boolean,
  delta = 3,
): number[] {
  if (points.length <= 2) {
    return points
  }
  if (!shortenStart && !shortenEnd) {
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

  if (firstPointX === lastPointX && firstPointY === lastPointY) {
    // do not shorten closed loops
    return points
  }

  if (shortenStart) {
    let dx = secondPointX - firstPointX
    let dy = secondPointY - firstPointY
    let l = Math.sqrt(dx * dx + dy * dy)
    if (shortenStart && l > delta * 2.5) {
      dx /= l
      dy /= l
      firstPointX = firstPointX + dx * delta
      firstPointY = firstPointY + dy * delta
    }
  }

  if (shortenEnd) {
    let dx = secondToLastX - lastPointX
    let dy = secondToLastY - lastPointY
    let l = Math.sqrt(dx * dx + dy * dy)
    if (l > delta * 2.5) {
      dx /= l
      dy /= l
      lastPointX = lastPointX + dx * delta
      lastPointY = lastPointY + dy * delta
    }
  }

  return [
    firstPointX,
    firstPointY,
    ...points.slice(2, points.length - 2),
    lastPointX,
    lastPointY,
  ]
}

// see https://mathworld.wolfram.com/Circle-LineIntersection.html
function closestLineCircleIntersection(
  p1: [number, number],
  p2: [number, number],
  center: [number, number],
  radius: number,
): [number, number] | undefined {
  let p1x = p1[0] - center[0]
  let p1y = p1[1] - center[1]
  let p2x = p2[0] - center[0]
  let p2y = p2[1] - center[1]

  let dx = p2x - p1x
  let dy = p2y - p1y
  let dr = dx * dx + dy * dy
  let D = p1x * p2y - p1y * p2x

  let delta = Math.sqrt(radius * radius * dr - D * D)
  if (delta < 0) {
    // no intersection
    return undefined
  }

  let sgndy = dy < 0 ? -1 : 1
  let ix1 = (D * dy + sgndy * dx * delta) / dr
  let iy1 = (-D * dx + Math.abs(dy) * delta) / dr

  if (delta > 0) {
    let ix2 = (D * dy - sgndy * dx * delta) / dr
    let iy2 = (-D * dx - Math.abs(dy) * delta) / dr

    let dix1 = p1x - ix1
    let diy1 = p1y - iy1
    let dix2 = p1x - ix2
    let diy2 = p1y - iy2
    if (dix1 * dix1 + diy1 * diy1 > dix2 * dix2 + diy2 * diy2) {
      ix1 = ix2
      iy1 = iy2
    }
  }

  return [ix1 + center[0], iy1 + center[1]]
}

function snapLineToCircle<T extends Arrow | Line>(
  a: T,
  overlays: Overlay[],
  snapAt: "start" | "end",
): T {
  if (a.wayPoints.length < 2) {
    return a
  }

  let first
  let second
  if (snapAt === "start") {
    first = a.wayPoints[0]
    second = a.wayPoints[1]
  } else {
    first = a.wayPoints[a.wayPoints.length - 1]
    second = a.wayPoints[a.wayPoints.length - 2]
  }

  let dx = second[0] - first[0]
  let dy = second[1] - first[1]
  let segmentLength = Math.sqrt(dx * dx + dy * dy)

  for (let o of overlays) {
    if (!o.rounded || o.width !== o.height) {
      // only consider circles
      continue
    }

    if (
      o.center[0] - Math.floor(o.center[0]) !== 0.5 ||
      o.center[1] - Math.floor(o.center[1]) !== 0.5
    ) {
      // circle must be in the center of a cell
      continue
    }

    let radius = o.width / 2
    if (segmentLength < radius) {
      // only snap line segment if it's longer than the circle's radius
      continue
    }

    let dx = first[0] - o.center[0]
    let dy = first[1] - o.center[1]
    let dist = Math.sqrt(dx * dx + dy * dy)

    // 10% tolerance
    if (Math.abs(dist - radius) < 0.1) {
      let i = closestLineCircleIntersection(first, second, o.center, radius)
      if (i !== undefined) {
        // shorten just a little bit to accomodate for rounded line ends
        let si = shortenLine([...i, ...second], true, false, a.thickness / 200)
        i = [si[0], si[1]]

        if (snapAt === "start") {
          return {
            ...a,
            wayPoints: [i, ...a.wayPoints.slice(1)],
          }
        } else {
          return {
            ...a,
            wayPoints: [...a.wayPoints.slice(0, a.wayPoints.length - 1), i],
          }
        }
      }
    }
  }

  return a
}

function euclidianBresenhamInterpolate(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): [number, number][] {
  let dx = Math.abs(x1 - x0)
  let sx = x0 < x1 ? 1 : -1
  let dy = -Math.abs(y1 - y0)
  let sy = y0 < y1 ? 1 : -1
  let err = dx + dy

  let result: [number, number][] = []
  while (true) {
    if (x0 === x1 && y0 === y1) {
      break
    }
    let e2 = 2 * err
    if (e2 > dy) {
      err += dy
      x0 += sx
      result.push([x0, y0])
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
      result.push([x0, y0])
    }
  }
  result.pop()
  return result
}

function filterDuplicatePoints(points: number[]): number[] {
  let i = 3
  while (i < points.length) {
    let prevx = points[i - 3]
    let prevy = points[i - 2]
    let currx = points[i - 1]
    let curry = points[i - 0]
    if (prevx === currx && prevy === curry) {
      points = [...points.slice(0, i - 1), ...points.slice(i + 1)]
    } else {
      i += 2
    }
  }
  return points
}

function makeCornerMarks(
  x: number,
  y: number,
  fontSize: number,
  leaveRoom: boolean,
  fontFamily: string,
  fontWeight: TextStyleFontWeight = "normal",
  n = 11,
): OldTextEx[] {
  let result = []

  for (let i = 0; i < n; ++i) {
    let text: OldTextEx = new Text({
      style: {
        fontFamily,
        fontSize,
        fontWeight,
      },
    })

    text.data = {
      draw: function ({ cellSize, currentFogRaster }) {
        let cx = x * cellSize + cellSize / 2
        let cy = y * cellSize + cellSize / 2
        let mx = cellSize / 3.2
        let my = cellSize / 3.4

        let fog = hasFog(currentFogRaster, x, y)

        switch (i) {
          case 0:
            if (leaveRoom && !fog) {
              text.x = cx - mx / 3
            } else {
              text.x = cx - mx
            }
            text.y = cy - my
            break
          case 4:
            if (leaveRoom && !fog) {
              text.x = cx + mx / 3
            } else {
              text.x = cx
            }
            text.y = cy - my
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
      },
    }

    text.anchor.set(0.5)
    text.scale.x = 0.5
    text.scale.y = 0.5

    result.push(text)
  }

  return result
}

function getRGBColor(colorString: string): number {
  return Color(colorString.trim()).rgbNumber()
}

function getAlpha(colorString: string): number {
  return Color(colorString.trim()).alpha()
}

function getThemeColour(style: CSSStyleDeclaration, color: string): number {
  return getRGBColor(`rgb(${style.getPropertyValue(color)})`)
}

function getThemeColours(elem: Element): ThemeColours {
  let rootStyle = window.getComputedStyle(elem)
  let backgroundColor = getThemeColour(rootStyle, "--bg")
  let foregroundColor = getThemeColour(rootStyle, "--fg")
  let digitColor = getThemeColour(rootStyle, "--digit")
  let smallDigitColor = getThemeColour(rootStyle, "--digit-small")

  let selectionYellow = getThemeColour(rootStyle, "--selection-yellow")
  let selectionRed = getThemeColour(rootStyle, "--selection-red")
  let selectionBlue = getThemeColour(rootStyle, "--selection-blue")
  let selectionGreen = getThemeColour(rootStyle, "--selection-green")

  return {
    backgroundColor,
    foregroundColor,
    digitColor,
    smallDigitColor,
    selection: {
      yellow: selectionYellow,
      red: selectionRed,
      green: selectionGreen,
      blue: selectionBlue,
    },
  }
}

function drawBackground(
  graphics: Graphics,
  width: number,
  height: number,
  themeColours: ThemeColours,
) {
  graphics.hitArea = new Rectangle(0, 0, width, height)
  graphics.rect(0, 0, width, height)
  graphics.fill(themeColours.backgroundColor)
}

function cellToScreenCoords(
  cell: [number, number],
  mx: number,
  my: number,
  cellSize: number,
): [number, number] {
  return [cell[1] * cellSize + mx, cell[0] * cellSize + my]
}

function penWaypointsToKey(
  wp1: number,
  wp2: number,
  penCurrentDrawEdge: boolean,
): number | undefined {
  let right
  let down
  if (penCurrentDrawEdge) {
    right = PENLINE_TYPE_EDGE_RIGHT
    down = PENLINE_TYPE_EDGE_DOWN
  } else {
    right = PENLINE_TYPE_CENTER_RIGHT
    down = PENLINE_TYPE_CENTER_DOWN
  }
  let p1 = ktoxy(wp1)
  let p2 = ktoxy(wp2)
  if (p2[0] > p1[0]) {
    return pltok(p1[0], p1[1], right)
  } else if (p2[0] < p1[0]) {
    return pltok(p2[0], p2[1], right)
  } else if (p2[1] > p1[1]) {
    return pltok(p1[0], p1[1], down)
  } else if (p2[1] < p1[1]) {
    return pltok(p2[0], p2[1], down)
  }
  return undefined
}

function drawOverlay(
  overlay: Overlay,
  mx: number,
  my: number,
  fontFamily: string,
): (OldGraphicsEx | OldTextEx)[] {
  let result = []

  if (
    overlay.backgroundColor !== undefined ||
    overlay.borderColor !== undefined
  ) {
    let g: OldGraphicsEx = new Graphics()

    if (overlay.rotation !== undefined) {
      g.rotation = overlay.rotation
    }

    g.data = {
      draw: function ({ cellSize }) {
        let center = cellToScreenCoords(overlay.center, mx, my, cellSize)
        g.x = center[0]
        g.y = center[1]
        let w = overlay.width * cellSize
        let h = overlay.height * cellSize
        if (overlay.rounded) {
          if (w === h) {
            g.ellipse(0, 0, w / 2, h / 2)
          } else {
            // we divide by 2.27 instead of 2 here because we want the same
            // look as we had with Pixi 6, which wasn't able to correctly round
            // the rectangle
            g.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2.27 - 1)
          }
        } else {
          g.rect(-w / 2, -h / 2, w, h)
        }
        let nBackgroundColour
        if (overlay.backgroundColor !== undefined) {
          nBackgroundColour = getRGBColor(overlay.backgroundColor)
          let alpha = getAlpha(overlay.backgroundColor)
          if (alpha === 1) {
            alpha = isGrey(nBackgroundColour) ? 1 : 0.5
          }
          g.fill({ color: nBackgroundColour, alpha })
        }
        if (overlay.borderColor !== undefined) {
          let nBorderColour = getRGBColor(overlay.borderColor)
          if (
            nBorderColour !== nBackgroundColour &&
            !(
              overlay.width === 1 &&
              overlay.height === 1 &&
              !overlay.rounded &&
              isGrey(nBorderColour)
            )
          ) {
            g.stroke({
              width: overlay.thickness ?? 2,
              color: nBorderColour,
              alpha: isGrey(nBorderColour) ? 1 : 0.5,
              alignment: 1,
            })
          }
        }
      },
    }

    result.push(g)
  }

  if (overlay.text !== undefined && overlay.text !== "") {
    let fontSize = (overlay.fontSize ?? 20) * SCALE_FACTOR
    if (overlay.fontSize !== undefined && overlay.fontSize < 14) {
      fontSize *= 1 / 0.75
    }

    let text: OldTextEx = new Text({
      text: overlay.text,
      style: {
        fontFamily,
        fontSize,
      },
    })

    if (overlay.fontColor) {
      text.style.fill = overlay.fontColor
    }

    if (overlay.backgroundColor !== undefined) {
      let bgc = Color(overlay.backgroundColor)
      if (Color(overlay.fontColor ?? "#000").contrast(bgc) < 2) {
        // text would be invisible on top of background
        if (bgc.isDark()) {
          text.style.stroke = { color: "#fff", width: 3 }
        } else {
          text.style.stroke = { color: "#000", width: 3 }
        }
      }
    }

    if (overlay.rotation !== undefined) {
      text.rotation = overlay.rotation
    }

    text.anchor.set(0.5)
    text.style.align = "center"

    if (overlay.fontSize !== undefined && overlay.fontSize < 14) {
      text.scale.x = 0.75
      text.scale.y = 0.75
    }

    text.data = {
      draw: function ({ cellSize, zoomFactor }) {
        let center = cellToScreenCoords(overlay.center, mx, my, cellSize)
        text.x = center[0]
        text.y = center[1]
        text.style.fontSize = Math.round(fontSize * zoomFactor)
      },
    }

    result.push(text)
  }

  return result
}

interface FogDisplayOptions {
  /**
   * `true` if fog should be visible, `false` if it should be completely disabled
   */
  enableFog: boolean

  /**
   * `true` if the fog should have a drop shadow
   */
  enableDropShadow: boolean
}

interface GridProps {
  maxWidth: number
  maxHeight: number
  portrait: boolean
  onFinishRender: () => void
  fogDisplayOptions?: FogDisplayOptions
}

const Grid = ({
  maxWidth,
  maxHeight,
  portrait,
  onFinishRender,
  fogDisplayOptions = { enableFog: true, enableDropShadow: true },
}: GridProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const gridElement = useRef<Container>()
  const cellsElement = useRef<Container>()
  const allElement = useRef<Container>()
  const cellElements = useRef<OldWithGraphicsExData[]>([])
  const regionElements = useRef<OldGraphicsEx[]>([])
  const cageElements = useRef<OldGraphicsEx[]>([])
  const cageLabelTextElements = useRef<OldTextEx[]>([])
  const cageLabelBackgroundElements = useRef<OldGraphicsEx[]>([])
  const lineElements = useRef<OldGraphicsEx[]>([])
  const extraRegionElements = useRef<OldGraphicsEx[]>([])
  const underlayElements = useRef<(OldGraphicsEx | OldTextEx)[]>([])
  const overlayElements = useRef<(OldGraphicsEx | OldTextEx)[]>([])
  const backgroundElement = useRef<Graphics>()
  const backgroundImageElements = useRef<OldSpriteEx[]>([])
  const fogElements = useRef<OldGraphicsEx[]>([])
  const givenCornerMarkElements = useRef<OldTextEx[]>([])
  const digitElements = useRef<OldTextEx[]>([])
  const centreMarkElements = useRef<OldTextEx[]>([])
  const cornerMarkElements = useRef<CornerMarkElement[]>([])
  const colourElements = useRef<OldGraphicsEx[]>([])
  const selectionElements = useRef<OldGraphicsEx[]>([])
  const errorElements = useRef<OldGraphicsEx[]>([])
  const penCurrentWaypoints = useRef<number[]>([])
  const penCurrentWaypointsAdd = useRef(true)
  const penCurrentWaypointsElements = useRef<PenWaypointGraphics[]>([])
  const penHitareaElements = useRef<OldGraphicsEx[]>([])
  const penCurrentDrawEdge = useRef(false)
  const penLineElements = useRef<OldGraphicsEx[]>([])

  const renderLoopStarted = useRef(0)
  const rendering = useRef(false)

  const game = useContext(GameContextState)
  const updateGame = useContext(GameContextDispatch)

  const {
    colourPalette,
    theme,
    selectionColour,
    customColours,
    zoom,
    fontSizeFactorDigits,
    fontSizeFactorCornerMarks,
    fontSizeFactorCentreMarks,
  } = useSettings(
    useShallow(state => ({
      colourPalette: state.colourPalette,
      theme: state.theme,
      selectionColour: state.selectionColour,
      customColours: state.customColours,
      zoom: state.zoom,
      fontSizeFactorDigits: state.fontSizeFactorDigits,
      fontSizeFactorCornerMarks: state.fontSizeFactorCornerMarks,
      fontSizeFactorCentreMarks: state.fontSizeFactorCentreMarks,
    })),
  )

  const currentMode = useRef(game.mode)

  const cellSize = game.data.cellSize * SCALE_FACTOR
  const cellSizeFactor = useRef(-1)

  let { result: app } = useAsyncEffect(
    async () => {
      // optimised resolution for different screens
      let resolution = Math.min(
        window.devicePixelRatio,
        window.devicePixelRatio === 2 ? 3 : 2.5,
      )

      let roundPixels: boolean | undefined = undefined
      if (window.devicePixelRatio < 2) {
        // good for dpi < 2
        roundPixels = true
      }

      // create PixiJS app
      let newApp = new Application()
      await newApp.init({
        resolution,
        antialias: true,
        backgroundAlpha: 0,
        autoDensity: true,
        autoStart: false,
        roundPixels,
      })
      if (!("_SUDOCLE_IS_TEST" in window)) {
        ref.current!.appendChild(newApp.canvas as any)
      }

      // it seems we don't need the system ticker, so stop it
      Ticker.system.stop()

      // Disable accessibility manager. We don't need it. Also, if it is enabled,
      // it creates an invisible div on top of our grid when the user presses the
      // tab key, which resets the cursor. We don't want the cursor to be reset!
      newApp.renderer.accessibility.destroy()

      return newApp
    },
    async () => {
      if (app !== undefined) {
        app.destroy(true, true)
      }
    },
    [],
  )

  const regions = useMemo(
    () =>
      flatten(
        game.data.regions.map(region => {
          return flatten(unionCells(region))
        }),
      ),
    [game.data],
  )

  const cages = useMemo<GridCage[]>(
    () =>
      flatten(
        game.data.cages
          .filter(cage => cage.cells?.length)
          .map(cage => {
            let unions = flatten(unionCells(cage.cells))
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
                borderColor: cage.borderColor,
                topleft,
              }
            })
          }),
      ),
    [game.data],
  )

  const extraRegions = useMemo(() => {
    if (Array.isArray(game.data.extraRegions)) {
      return flatten(
        game.data.extraRegions
          .filter(r => r.cells?.length)
          .map(r => {
            let unions = flatten(unionCells(r.cells))
            return unions.map(union => {
              return {
                outline: union,
                backgroundColor: r.backgroundColor,
              }
            })
          }),
      )
    } else {
      return []
    }
  }, [game.data])

  const selectCell = useCallback(
    (k: number, evt: FederatedPointerEvent | TouchEvent, append = false) => {
      if (currentMode.current === MODE_PEN) {
        // do nothing in pen mode
        return
      }

      let action: SelectionAction["action"] = append ? ACTION_PUSH : ACTION_SET
      if (evt instanceof FederatedPointerEvent) {
        let oe = evt.originalEvent
        let ne = oe.nativeEvent
        if ("metaKey" in ne) {
          if (ne.metaKey || ne.ctrlKey) {
            if (ne.shiftKey) {
              action = ACTION_REMOVE
            } else {
              action = ACTION_PUSH
            }
          }
        }
      }

      updateGame({
        type: TYPE_SELECTION,
        action,
        k,
      })
    },
    [updateGame],
  )

  // Custom render loop. Render on demand and then repeat rendering for
  // MAX_RENDER_LOOP_TIME milliseconds. Then pause rendering again. This has
  // two benefits: (1) it forces the browser to refresh the screen as quickly
  // as possible (without this, there might be lags of 500ms - 1s every now
  // and then!), (2) it saves CPU cycles and therefore battery.
  const renderNow = useCallback(() => {
    if ("_SUDOCLE_IS_TEST" in window) {
      // don't render in tests - we will call screenshotNow() instead when
      // we are ready
      return
    }

    function doRender() {
      let elapsed = +new Date() - renderLoopStarted.current
      if (app !== undefined && elapsed < MAX_RENDER_LOOP_TIME) {
        rendering.current = true
        app.render()
        requestAnimationFrame(doRender)
      } else {
        rendering.current = false
      }
    }

    renderLoopStarted.current = +new Date()
    if (!rendering.current) {
      doRender()
    }
  }, [app])

  const screenshotNow = useCallback(() => {
    if (app !== undefined) {
      app.render()
      let url = app.canvas.toDataURL!()
      ;(window as any).screenshotRendered(url)
    }
  }, [app])

  const onPenMove = useCallback(
    (e: FederatedPointerEvent, cellSize: number) => {
      if (e.target === null) {
        // pointer is not over the hit area
        return
      }
      if (e.buttons !== 1) {
        // let mouse button is not pressed
        return
      }

      let gridBounds = gridElement.current!.getBounds()
      let x = e.global.x - gridBounds.x
      let y = e.global.y - gridBounds.y

      let fCellX = x / cellSize
      let fCellY = y / cellSize
      let cellX = Math.floor(fCellX)
      let cellY = Math.floor(fCellY)
      let cellDX = fCellX - cellX
      let cellDY = fCellY - cellY
      if (penCurrentWaypoints.current.length === 0) {
        // snap to cell edge or cell center
        if (
          cellDX >= 0.25 &&
          cellDX <= 0.75 &&
          cellDY >= 0.25 &&
          cellDY <= 0.75
        ) {
          penCurrentDrawEdge.current = false
        } else {
          penCurrentDrawEdge.current = true
          if (cellDX >= 0.5) {
            cellX++
          }
          if (cellDY >= 0.5) {
            cellY++
          }
        }
      } else {
        if (penCurrentDrawEdge.current) {
          if (cellDX >= 0.5) {
            cellX++
          }
          if (cellDY >= 0.5) {
            cellY++
          }
        }
      }

      let k = xytok(cellX, cellY)

      if (penCurrentWaypoints.current.length === 0) {
        penCurrentWaypoints.current = [k]
      } else if (
        penCurrentWaypoints.current[penCurrentWaypoints.current.length - 1] ===
        k
      ) {
        // nothing to do
        return
      } else {
        penCurrentWaypoints.current = produce(
          penCurrentWaypoints.current,
          pcw => {
            let toAdd = []
            if (pcw.length > 0) {
              let fp = pcw[pcw.length - 1]
              let fpp = ktoxy(fp)
              let dx = Math.abs(cellX - fpp[0])
              let dy = Math.abs(cellY - fpp[1])
              if (dx + dy !== 1) {
                // cursor was moved diagonally or jumped to a distant cell
                // interpolate between the last cell and the new one
                let interpolated = euclidianBresenhamInterpolate(
                  fpp[0],
                  fpp[1],
                  cellX,
                  cellY,
                )
                for (let ip of interpolated) {
                  toAdd.push(xytok(ip[0], ip[1]))
                }
              }
            }
            toAdd.push(k)

            // check if we've moved backwards and, if so, how much
            let matched = 0
            for (
              let a = pcw.length - 2, b = 0;
              a >= 0 && b < toAdd.length;
              --a, ++b
            ) {
              if (pcw[a] === toAdd[b]) {
                matched++
              } else {
                break
              }
            }
            if (matched > 0) {
              // remove as many waypoints as we've moved back
              pcw.splice(-matched)
            } else {
              // we did not move backwards - just add the new waypoints
              for (let ap of toAdd) {
                pcw.push(ap)
              }
            }
          },
        )

        // check if we are adding a pen line or removing it
        if (penCurrentWaypoints.current.length > 1) {
          let firstKey = penWaypointsToKey(
            penCurrentWaypoints.current[0],
            penCurrentWaypoints.current[1],
            penCurrentDrawEdge.current,
          )
          let visible = penLineElements.current.some(
            e => e.data?.k === firstKey && e.visible,
          )
          penCurrentWaypointsAdd.current = !visible
        }
      }

      // render waypoints
      penCurrentWaypointsElements.current.forEach(e =>
        e.data?.draw({ penCurrentWaypoints: penCurrentWaypoints.current }),
      )
      renderNow()
    },
    [renderNow],
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      let digit = e.code.match("Digit([0-9])")
      if (digit) {
        let nd = +digit[1]
        updateGame({
          type: TYPE_DIGITS,
          action: ACTION_SET,
          digit: nd,
        })
        e.preventDefault()
      }

      let numpad = e.code.match("Numpad([0-9])")
      if (numpad && +e.key === +numpad[1]) {
        let nd = +numpad[1]
        updateGame({
          type: TYPE_DIGITS,
          action: ACTION_SET,
          digit: nd,
        })
        e.preventDefault()
      }

      if (e.key === "Backspace" || e.key === "Delete" || e.key === "Clear") {
        updateGame({
          type: TYPE_DIGITS,
          action: ACTION_REMOVE,
        })
      }
    },
    [updateGame],
  )

  function onBackgroundClick(e: MouseEvent) {
    e.stopPropagation()
  }

  function onDoubleClick(e: MouseEvent) {
    if (game.selection.size === 0 || !e.altKey) {
      return
    }

    // get color of last cell clicked
    let last = [...game.selection].pop()!
    let colour = game.colours.get(last)

    if (colour !== undefined) {
      // find all cells with the same colour
      let allCells = []
      for (let [k, c] of game.colours) {
        if (c.colour === colour.colour) {
          allCells.push(k)
        }
      }

      let action: SelectionAction["action"] =
        e.metaKey || e.ctrlKey ? ACTION_PUSH : ACTION_SET
      updateGame({
        type: TYPE_SELECTION,
        action,
        k: allCells,
      })
    }
  }

  const onPointerUp = useCallback(() => {
    if (penCurrentWaypoints.current.length > 0) {
      let penLines = []
      for (let i = 0; i < penCurrentWaypoints.current.length - 1; ++i) {
        let k = penWaypointsToKey(
          penCurrentWaypoints.current[i],
          penCurrentWaypoints.current[i + 1],
          penCurrentDrawEdge.current,
        )
        if (k !== undefined) {
          penLines.push(k)
        }
      }
      let action: PenLinesAction["action"]
      if (penCurrentWaypointsAdd.current) {
        action = ACTION_PUSH
      } else {
        action = ACTION_REMOVE
      }
      updateGame({
        type: TYPE_PENLINES,
        action,
        k: penLines,
      })
      penCurrentWaypoints.current = []
      penCurrentDrawEdge.current = false

      // render waypoints (this will basically remove them from the grid)
      penCurrentWaypointsElements.current.forEach(e =>
        e.data?.draw({ penCurrentWaypoints: penCurrentWaypoints.current }),
      )
      renderNow()
    }
  }, [updateGame, renderNow])

  useEffect(() => {
    currentMode.current = game.mode

    if (app !== undefined) {
      if (game.mode === MODE_PEN) {
        app.renderer.events.setCursor("crosshair")
      } else {
        app.renderer.events.setCursor("pointer")
      }
    }

    penHitareaElements.current.forEach(
      e => (e.visible = game.mode === MODE_PEN),
    )

    penCurrentWaypoints.current = []
  }, [app, game.mode])

  useEffect(() => {
    if (app === undefined) {
      return
    }

    // register touch handler
    document.addEventListener("pointerup", onPointerUp, false)
    document.addEventListener("pointercancel", onPointerUp, false)

    let defaultFontFamily = getComputedStyle(document.body).getPropertyValue(
      "--font-roboto",
    )

    let fontSizeCageLabels = 26

    // create grid
    let all = new Container()
    allElement.current = all
    let grid = new Container()
    gridElement.current = grid
    let cells = new Container()
    cellsElement.current = cells

    all.sortableChildren = true
    grid.sortableChildren = true

    // ***************** Layers and zIndexes:

    // all                            sortable
    //   background            -1000
    //   background image        -40
    //   extra regions           -30
    //   underlays               -20
    //   lines and arrows        -10
    //   arrow heads             -10
    //   fog                      -1
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
    //   pen lines                60
    //   pen waypoints            70
    //   pen tool hitarea         80

    // ***************** render everything that could contribute to bounds

    // fog
    let fogMask: OldGraphicsEx | null = null
    if (game.data.fogLights !== undefined) {
      let fog: OldGraphicsEx = new Graphics()
      fog.zIndex = -1
      fog.data = {
        draw: function ({ cellSize, currentFogRaster }) {
          if (currentFogRaster === undefined) {
            return
          }

          let flatCells: [number, number][] = []
          currentFogRaster.forEach((row, y) => {
            row.forEach((v, x) => {
              if (v === 1) {
                flatCells.push([y, x])
              }
            })
          })

          let polygons = unionCells(flatCells)
          for (let polygon of polygons) {
            let poly = polygon.map(o => o.map(r => r * cellSize))
            fog.poly(poly[0])
            fog.fill(0x8b909b)
            if (poly.length > 1) {
              for (let i = 1; i < poly.length; ++i) {
                fog.poly(poly[i])
              }
              fog.cut()
            }
          }
        },
      }
      if (fogDisplayOptions.enableDropShadow) {
        let dropShadow = new DropShadowFilter({
          offset: { x: 0, y: 0 },
          blur: 35,
          quality: 35,
          alpha: 0.9,
          color: 0x272e31,
        })
        dropShadow.padding = 20
        fog.filters = [dropShadow]
      }
      fogElements.current.push(fog)
      all.addChild(fog)

      fogMask = new Graphics()
      fogMask.data = {
        draw: function ({ cellSize, currentFogLights }) {
          if (currentFogLights !== undefined) {
            for (let light of currentFogLights) {
              let y = light.center[0]
              let x = light.center[1]
              if (light.size === 3) {
                fogMask!.rect(
                  (x - 1) * cellSize,
                  (y - 1) * cellSize,
                  cellSize * 3,
                  cellSize * 3,
                )
              } else {
                fogMask!.rect(x * cellSize, y * cellSize, cellSize, cellSize)
              }
            }
          }

          // always show area outside of grid
          fogMask!.rect(
            -5 * cellSize,
            -5 * cellSize,
            cellSize * 5,
            cellSize * (game.data.cells.length + 10),
          )
          fogMask!.rect(
            cellSize * game.data.cells[0].length,
            -5 * cellSize,
            cellSize * 5,
            cellSize * (game.data.cells.length + 10),
          )
          fogMask!.rect(
            0,
            -5 * cellSize,
            cellSize * game.data.cells[0].length,
            cellSize * 5,
          )
          fogMask!.rect(
            0,
            cellSize * game.data.cells.length,
            cellSize * game.data.cells[0].length,
            cellSize * 5,
          )

          fogMask!.fill(0)
        },
      }
      fogElements.current.push(fogMask)
      all.addChild(fogMask)
    }

    // render cells
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let cell = new Cell(x, y)

        cell.graphics.on("pointerdown", function (e: FederatedPointerEvent) {
          selectCell(cell!.k!, e)
          e.stopPropagation()
          e.originalEvent.preventDefault()
        })

        cell.graphics.on("pointerover", function (e: FederatedPointerEvent) {
          if (e.buttons === 1) {
            selectCell(cell!.k!, e, true)
          }
          e.stopPropagation()
        })

        cells.addChild(cell.graphics)
        cellElements.current.push(wrapOld(cell))
      })
    })

    // render regions
    for (let r of regions) {
      let poly: OldGraphicsEx = new Graphics()
      poly.data = {
        draw: function ({ cellSize, themeColours }) {
          poly.poly(r.map(v => v * cellSize))
          poly.stroke({ width: 3, color: themeColours.foregroundColor })
        },
      }
      poly.zIndex = 10
      grid.addChild(poly)
      regionElements.current.push(poly)
    }

    // render cages
    let cageOutlinesContainer = new Container()
    cageOutlinesContainer.zIndex = 1
    cageOutlinesContainer.mask = fogMask
    let cageTopLeftTextContainer = new Container()
    cageTopLeftTextContainer.zIndex = 3
    cageTopLeftTextContainer.mask = fogMask
    let cageTopLeftBgContainer = new Container()
    cageTopLeftBgContainer.zIndex = 2
    cageTopLeftBgContainer.mask = fogMask
    for (let cage of cages) {
      // draw outline
      let poly: OldGraphicsEx = new Graphics()
      poly.data = {
        borderColor: cage.borderColor
          ? getRGBColor(cage.borderColor)
          : undefined,
        draw: function ({ cellSize, themeColours }) {
          let disposedOutline = disposePolygon(
            cage.outline.map(v => v * cellSize),
            regions.map(rarr => rarr.map(v => v * cellSize)),
            1,
          )
          let shrunkenOutline = shrinkPolygon(disposedOutline, 3)
          let color = cage.borderColor
            ? getRGBColor(cage.borderColor)
            : themeColours.foregroundColor
          let alpha = cage.borderColor ? getAlpha(cage.borderColor) : 1
          drawDashedPolygon(shrunkenOutline, 3, 2, poly)
          poly.stroke({ width: 1, color, alpha: alpha })
        },
      }
      cageOutlinesContainer.addChild(poly)
      cageElements.current.push(poly)

      if (
        cage.value !== undefined &&
        cage.value !== null &&
        `${cage.value}`.trim() !== ""
      ) {
        // create cage label
        // use larger font and scale down afterwards to improve text rendering
        let topleftText: OldTextEx = new Text({
          text: cage.value,
          style: {
            fontFamily: defaultFontFamily,
            fontSize: fontSizeCageLabels,
          },
        })
        topleftText.scale.x = 0.5
        topleftText.scale.y = 0.5
        topleftText.data = {
          draw: function ({ cellSize }) {
            topleftText.x = cage.topleft[1] * cellSize + cellSize / 20
            topleftText.y = cage.topleft[0] * cellSize + cellSize / 60 + 0.25
          },
        }
        cageTopLeftTextContainer.addChild(topleftText)
        cageLabelTextElements.current.push(topleftText)

        let topleftBg: OldGraphicsEx = new Graphics()
        topleftBg.data = {
          draw: function ({ cellSize }) {
            topleftBg.rect(
              0,
              0,
              topleftText.width + cellSize / 10 - 0.5,
              topleftText.height + cellSize / 60 + 0.5,
            )
            topleftBg.fill(0xffffff)
            topleftBg.x = cage.topleft[1] * cellSize + 0.5
            topleftBg.y = cage.topleft[0] * cellSize + 0.5
          },
        }
        cageTopLeftBgContainer.addChild(topleftBg)
        cageLabelBackgroundElements.current.push(topleftBg)
      }
    }
    grid.addChild(cageOutlinesContainer)
    grid.addChild(cageTopLeftTextContainer)
    grid.addChild(cageTopLeftBgContainer)

    grid.addChild(cells)
    grid.zIndex = 30
    all.addChild(grid)

    // render extra regions
    let extraRegionsContainer = new Container()
    extraRegionsContainer.zIndex = -30
    extraRegionsContainer.mask = fogMask
    for (let r of extraRegions) {
      let poly: OldGraphicsEx = new Graphics()
      poly.data = {
        draw: function ({ cellSize }) {
          let disposedOutline = disposePolygon(
            r.outline.map(v => v * cellSize),
            regions.map(rarr => rarr.map(v => v * cellSize)),
            1,
          )
          let shrunkenOutline = shrinkPolygon(disposedOutline, 3)
          poly.poly(shrunkenOutline)
          poly.fill(getRGBColor(r.backgroundColor))
        },
      }
      extraRegionsContainer.addChild(poly)
      extraRegionElements.current.push(poly)
    }
    all.addChild(extraRegionsContainer)

    // sort lines and arrows by thickness
    let lines: ((Line | Arrow) & {
      isArrow: boolean
      shortenStart: boolean
      shortenEnd: boolean
    })[] = [
      ...game.data.lines.map(l => {
        let os = [...game.data.underlays, ...game.data.overlays]
        let { shortenStart, shortenEnd } = needsLineShortening(
          l,
          game.data.lines,
        )
        let startSnappedLine = snapLineToCircle(l, os, "start")
        if (startSnappedLine !== l) {
          shortenStart = false
        }
        let endSnappedLine = snapLineToCircle(startSnappedLine, os, "end")
        if (endSnappedLine !== startSnappedLine) {
          shortenEnd = false
        }
        return {
          ...endSnappedLine,
          isArrow: false,
          shortenStart,
          shortenEnd,
        }
      }),
      ...game.data.arrows.map(a => {
        let snappedArrow = snapLineToCircle(
          a,
          [...game.data.underlays, ...game.data.overlays],
          "start",
        )
        return {
          ...snappedArrow,
          isArrow: true,
          shortenStart: snappedArrow === a,
          shortenEnd: true,
        }
      }),
    ]
    lines.sort((a, b) => b.thickness - a.thickness)

    // add lines and arrows
    let linesContainer = new Container()
    linesContainer.zIndex = -10
    linesContainer.mask = fogMask
    lines.forEach(line => {
      let poly: OldGraphicsEx = new Graphics()
      poly.alpha = getAlpha(line.color)
      poly.data = {
        draw: function ({ cellSize }) {
          let points = shortenLine(
            filterDuplicatePoints(
              flatten(
                line.wayPoints.map(wp =>
                  cellToScreenCoords(wp, grid.x, grid.y, cellSize),
                ),
              ),
            ),
            line.shortenStart,
            line.shortenEnd,
          )
          let lvx = 0
          let lvy = 0
          poly.moveTo(points[0], points[1])
          for (let i = 2; i < points.length; i += 2) {
            // calculate direction
            let vx = points[i] - points[i - 2]
            let vy = points[i + 1] - points[i - 1]
            let vl = Math.sqrt(vx * vx + vy * vy)
            vx /= vl
            vy /= vl

            // Start new line if we're going backwards (i.e. if the direction
            // of the current line segement is opposite the direction of the
            // last segment. We need to do this to make caps at such turning
            // points actually round and to avoid other drawing issues.
            if ((vx === lvx && vy === -lvy) || (vx === -lvx && vy === lvy)) {
              poly.moveTo(points[i - 2], points[i - 1])
            }

            poly.lineTo(points[i], points[i + 1])

            lvx = vx
            lvy = vy
          }
          poly.stroke({
            width: line.thickness * SCALE_FACTOR,
            color: getRGBColor(line.color),
            cap: "round",
            join: "round",
          })

          if (!line.isArrow && (line as Line).backgroundColor !== undefined) {
            poly.fill((line as Line).backgroundColor)
          }
        },
      }
      linesContainer.addChild(poly)
      lineElements.current.push(poly)

      // arrow heads
      if (line.isArrow && line.wayPoints.length > 1) {
        let arrow = line as Arrow
        let head: OldGraphicsEx = new Graphics()
        head.data = {
          draw: function ({ cellSize }) {
            let points = shortenLine(
              filterDuplicatePoints(
                flatten(
                  arrow.wayPoints.map(wp =>
                    cellToScreenCoords(wp, grid.x, grid.y, cellSize),
                  ),
                ),
              ),
              line.shortenStart,
              line.shortenEnd,
            )
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
            head.moveTo(lastPointX, lastPointY)
            head.lineTo(ex1, ey1)
            head.moveTo(lastPointX, lastPointY)
            head.lineTo(ex2, ey2)
            head.stroke({
              alpha: getAlpha(arrow.color),
              width: arrow.thickness * SCALE_FACTOR,
              color: getRGBColor(arrow.color),
              cap: "round",
              join: "round",
            })
          },
        }
        linesContainer.addChild(head)
        lineElements.current.push(head)
      }
    })
    all.addChild(linesContainer)

    // add underlays
    let underlaysContainer = new Container()
    underlaysContainer.zIndex = -20
    underlaysContainer.mask = fogMask
    game.data.underlays.forEach(underlay => {
      let es = drawOverlay(underlay, grid.x, grid.y, defaultFontFamily)
      for (let e of es) {
        underlaysContainer.addChild(e)
        underlayElements.current.push(e)
      }
    })
    all.addChild(underlaysContainer)

    // add overlays
    let overlaysContainer = new Container()
    overlaysContainer.zIndex = 40
    overlaysContainer.mask = fogMask
    game.data.overlays.forEach(overlay => {
      let es = drawOverlay(overlay, grid.x, grid.y, defaultFontFamily)
      for (let e of es) {
        overlaysContainer.addChild(e)
        overlayElements.current.push(e)
      }
    })
    all.addChild(overlaysContainer)

    // draw a background that covers all elements
    let background = new Graphics()
    background.eventMode = "static"
    background.zIndex = -1000
    background.on("pointerdown", () => {
      if (currentMode.current !== MODE_PEN) {
        updateGame({
          type: TYPE_SELECTION,
          action: ACTION_CLEAR,
        })
      }
    })
    backgroundElement.current = background
    app.stage.addChild(background)

    // add background image
    if (game.data.metadata?.bgimage !== undefined) {
      let sprite: OldSpriteEx = Sprite.from(game.data.metadata.bgimage)
      sprite.zIndex = -40
      sprite.alpha = 0.2
      sprite.data = {
        draw: function ({ cellSize }) {
          sprite.x = -cellSize / 4
          sprite.y = -cellSize / 4
          sprite.width = cellSize * game.data.cells[0].length + cellSize / 2
          sprite.height = cellSize * game.data.cells.length + cellSize / 2
        },
      }
      backgroundImageElements.current.push(sprite)
      all.addChild(sprite)
    }

    app.stage.addChild(all)

    // ***************** draw other elements that don't contribute to the bounds

    let themeColours = getThemeColours(ref.current!)

    // create text elements for given corner marks
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let pms = col.pencilMarks
        if (pms === undefined) {
          return
        }
        let arr: (string | number)[]
        if (Array.isArray(pms)) {
          arr = pms
        } else {
          arr = [pms]
        }

        let hcv = hasCageValue(x, y, cages)
        let cms = makeCornerMarks(
          x,
          y,
          FONT_SIZE_CORNER_MARKS_HIGH_DPI,
          hcv,
          defaultFontFamily,
          "700",
          arr.length,
        )
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
        let text: OldTextEx = new Text({
          style: {
            fontFamily: defaultFontFamily,
            fontSize: FONT_SIZE_DIGITS,
          },
        })
        text.visible = false
        text.zIndex = 50
        text.anchor.set(0.5)
        text.data = {
          k: xytok(x, y),
          draw: function ({ cellSize }) {
            text.x = x * cellSize + cellSize / 2
            text.y = y * cellSize + cellSize / 2
          },
        }
        all.addChild(text)
        digitElements.current.push(text)
      })
    })

    // create empty text elements for corner marks
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let cell: CornerMarkElement = {
          data: {
            k: xytok(x, y),
          },
          elements: [] as OldTextEx[],
        }

        let leaveRoom = hasCageValue(x, y, cages) || hasGivenCornerMarks(col)
        let cms = makeCornerMarks(
          x,
          y,
          FONT_SIZE_CORNER_MARKS_HIGH_DPI,
          leaveRoom,
          defaultFontFamily,
          "normal",
          11,
        )
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
        let text: OldTextEx = new Text({
          style: {
            fontFamily: defaultFontFamily,
            fontSize: FONT_SIZE_CENTRE_MARKS_HIGH_DPI,
          },
        })
        text.zIndex = 50
        text.anchor.set(0.5)
        text.style.fill = themeColours.digitColor
        text.scale.x = 0.5
        text.scale.y = 0.5
        text.visible = false
        text.data = {
          k: xytok(x, y),
          draw: function ({ cellSize }) {
            text.x = x * cellSize + cellSize / 2
            text.y = y * cellSize + cellSize / 2
          },
        }
        all.addChild(text)
        centreMarkElements.current.push(text)
      })
    })

    // create invisible rectangles for colours
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let rect: OldGraphicsEx = new Graphics()
        rect.alpha = 0
        rect.zIndex = 0
        rect.data = {
          k: xytok(x, y),
          draw: function ({ cellSize }) {
            rect.x = x * cellSize
            rect.y = y * cellSize
          },
        }
        all.addChild(rect)
        colourElements.current.push(rect)
      })
    })

    // create invisible rectangles for selection
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let rect: OldGraphicsEx = new Graphics()
        rect.visible = false
        rect.zIndex = 20
        rect.data = {
          k: xytok(x, y),
          draw: function ({ cellSize }) {
            rect.rect(0.5, 0.5, cellSize - 1, cellSize - 1)
            rect.fill({ color: 0xffde2a, alpha: 0.5 })
            rect.x = x * cellSize
            rect.y = y * cellSize
          },
        }
        all.addChild(rect)
        selectionElements.current.push(rect)
      })
    })

    // create invisible rectangles for errors
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        let rect: OldGraphicsEx = new Graphics()
        rect.visible = false
        rect.zIndex = 10
        rect.data = {
          k: xytok(x, y),
          draw: function ({ cellSize }) {
            rect.rect(0.5, 0.5, cellSize - 1, cellSize - 1)
            rect.fill({ color: 0xb33a3a, alpha: 0.5 })
            rect.x = x * cellSize
            rect.y = y * cellSize
          },
        }
        all.addChild(rect)
        errorElements.current.push(rect)
      })
    })

    // create invisible elements for pen lines
    game.data.cells.forEach((row, y) => {
      row.forEach((col, x) => {
        function makeLine(
          rx: number,
          ry: number,
          horiz: boolean,
          dx: number,
          dy: number,
          type: number,
        ) {
          let line: OldGraphicsEx = new Graphics()
          line.visible = false
          line.zIndex = 60
          line.data = {
            k: pltok(rx, ry, type),
            draw: function ({ cellSize }) {
              line.moveTo(0, 0)
              if (horiz) {
                line.lineTo(cellSize, 0)
              } else {
                line.lineTo(0, cellSize)
              }
              line.x = (rx + dx) * cellSize
              line.y = (ry + dy) * cellSize
              line.stroke({
                width: 2 * SCALE_FACTOR,
                color: 0,
                cap: "round",
                join: "round",
              })
            },
          }
          all.addChild(line)
          penLineElements.current.push(line)
        }

        if (x < row.length - 1) {
          makeLine(x, y, true, 0.5, 0.5, PENLINE_TYPE_CENTER_RIGHT)
        }
        makeLine(x, y, true, 0, 0, PENLINE_TYPE_EDGE_RIGHT)
        if (y === game.data.cells.length - 1) {
          makeLine(x, y + 1, true, 0, 0, PENLINE_TYPE_EDGE_RIGHT)
        }
        if (y < game.data.cells.length - 1) {
          makeLine(x, y, false, 0.5, 0.5, PENLINE_TYPE_CENTER_DOWN)
        }
        makeLine(x, y, false, 0, 0, PENLINE_TYPE_EDGE_DOWN)
        if (x === row.length - 1) {
          makeLine(x + 1, y, false, 0, 0, PENLINE_TYPE_EDGE_DOWN)
        }
      })
    })

    // create element that visualises current pen waypoints
    let penWaypoints: PenWaypointGraphics = new Graphics()
    penWaypoints.zIndex = 70
    penWaypoints.data = {
      draw: function ({ cellSize, penCurrentWaypoints }) {
        let that = penWaypoints.data!
        that.cellSize = cellSize ?? that.cellSize
        if (that.cellSize === undefined) {
          return
        }

        penWaypoints.clear()
        if (penCurrentWaypoints.length > 1) {
          let color
          if (penCurrentWaypointsAdd.current) {
            color = 0x009e73
          } else {
            color = 0xde3333
          }
          let d = 0.5
          if (penCurrentDrawEdge.current) {
            d = 0
          }
          let p0 = ktoxy(penCurrentWaypoints[0])
          penWaypoints.moveTo(
            (p0[0] + d) * that.cellSize,
            (p0[1] + d) * that.cellSize,
          )
          for (let i = 0; i < penCurrentWaypoints.length - 1; ++i) {
            let p = ktoxy(penCurrentWaypoints[i + 1])
            penWaypoints.lineTo(
              (p[0] + d) * that.cellSize,
              (p[1] + d) * that.cellSize,
            )
          }
          penWaypoints.stroke({
            width: 3 * SCALE_FACTOR,
            color,
            cap: "round",
            join: "round",
          })
        }
      },
    }
    all.addChild(penWaypoints)
    penCurrentWaypointsElements.current.push(penWaypoints)

    // add invisible hit area for pen tool
    let penHitArea: OldGraphicsEx = new Graphics()
    penHitArea.eventMode = "static"
    penHitArea.cursor = "crosshair"
    penHitArea.zIndex = 80
    penHitArea.visible = false
    penHitArea.data = {
      draw: function ({ cellSize }) {
        penHitArea.hitArea = new Rectangle(
          0,
          0,
          game.data.cells[0].length * cellSize,
          game.data.cells.length * cellSize,
        )
        penHitArea.removeAllListeners()
        penHitArea.on("pointermove", e => onPenMove(e, cellSize))
      },
    }
    all.addChild(penHitArea)
    penHitareaElements.current.push(penHitArea)

    // memoize draw calls to improve performance
    const wrapDraw =
      (
        e: OldWithGraphicsExData,
        draw: NonNullable<OldWithGraphicsExData["data"]>["draw"],
      ): NonNullable<OldWithGraphicsExData["data"]>["draw"] =>
      options => {
        if (e instanceof Graphics) {
          e.clear()
        }
        draw(options)
      }
    const wrapDrawWaypoints =
      (
        e: PenWaypointGraphics,
        draw: NonNullable<PenWaypointGraphics["data"]>["draw"],
      ): NonNullable<PenWaypointGraphics["data"]>["draw"] =>
      options => {
        if (e instanceof Graphics) {
          e.clear()
        }
        draw(options)
      }
    let elementsToMemoize = [
      cellElements,
      regionElements,
      cageElements,
      cageLabelTextElements,
      cageLabelBackgroundElements,
      lineElements,
      extraRegionElements,
      underlayElements,
      overlayElements,
      fogElements,
      givenCornerMarkElements,
      digitElements,
      centreMarkElements,
      colourElements,
      selectionElements,
      errorElements,
      penLineElements,
      penHitareaElements,
      backgroundImageElements,
    ]
    for (let r of elementsToMemoize) {
      for (let e of r.current) {
        if (e.data?.draw !== undefined) {
          e.data.draw = memoizeOne(wrapDraw(e, e.data.draw))
        }
      }
    }
    for (let e of cornerMarkElements.current) {
      for (let ce of e.elements) {
        if (ce.data?.draw !== undefined) {
          ce.data.draw = memoizeOne(wrapDraw(ce, ce.data.draw))
        }
      }
    }
    for (let e of penCurrentWaypointsElements.current) {
      if (e.data?.draw !== undefined) {
        e.data.draw = memoizeOne(wrapDrawWaypoints(e, e.data.draw))
      }
    }

    if (onFinishRender) {
      onFinishRender()
    }

    return () => {
      if (allElement.current !== undefined) {
        allElement.current.destroy(true)
      }

      allElement.current = undefined
      gridElement.current = undefined
      cellsElement.current = undefined
      cellElements.current = []
      regionElements.current = []
      cageElements.current = []
      cageLabelTextElements.current = []
      cageLabelBackgroundElements.current = []
      lineElements.current = []
      extraRegionElements.current = []
      underlayElements.current = []
      overlayElements.current = []
      fogElements.current = []
      givenCornerMarkElements.current = []
      digitElements.current = []
      centreMarkElements.current = []
      cornerMarkElements.current = []
      colourElements.current = []
      selectionElements.current = []
      errorElements.current = []
      penCurrentWaypointsElements.current = []
      penHitareaElements.current = []
      penLineElements.current = []
      backgroundImageElements.current = []

      document.removeEventListener("pointercancel", onPointerUp)
      document.removeEventListener("pointerup", onPointerUp)
    }
  }, [
    app,
    game.data,
    cellSize,
    regions,
    cages,
    extraRegions,
    selectCell,
    onPenMove,
    updateGame,
    onFinishRender,
    onPointerUp,
    fogDisplayOptions.enableDropShadow,
  ])

  useEffect(() => {
    // reset cell size on next draw
    cellSizeFactor.current = -1
  }, [maxWidth, maxHeight, portrait, zoom, game.data])

  useEffect(() => {
    if (app === undefined) {
      return
    }

    if (cellSizeFactor.current === -1) {
      cellSizeFactor.current = zoom + ZOOM_DELTA
    }
    let cs = Math.floor(cellSize * cellSizeFactor.current)
    let allBounds: Bounds
    let gridBounds: Bounds

    allElement.current!.x = allElement.current!.y = 0

    let themeColours = getThemeColours(ref.current!)

    for (let i = 0; i < 10; ++i) {
      let elementsToRedraw = [
        cellElements,
        regionElements,
        cageElements,
        cageLabelTextElements,
        cageLabelBackgroundElements,
        lineElements,
        extraRegionElements,
        underlayElements,
        overlayElements,
        fogElements,
        givenCornerMarkElements,
        digitElements,
        centreMarkElements,
        colourElements,
        selectionElements,
        errorElements,
        penLineElements,
        penHitareaElements,
        backgroundImageElements,
      ]
      for (let r of elementsToRedraw) {
        for (let e of r.current) {
          e.data?.draw({
            cellSize: cs,
            zoomFactor: cellSizeFactor.current,
            currentDigits: game.digits,
            currentFogLights: game.fogLights,
            currentFogRaster: game.fogRaster,
            themeColours,
          })
        }
      }
      for (let e of cornerMarkElements.current) {
        for (let ce of e.elements) {
          ce.data?.draw({
            cellSize: cs,
            zoomFactor: cellSizeFactor.current,
            currentDigits: game.digits,
            currentFogLights: game.fogLights,
            currentFogRaster: game.fogRaster,
            themeColours,
          })
        }
      }
      for (let e of penCurrentWaypointsElements.current) {
        e.data?.draw({
          cellSize: cs,
          penCurrentWaypoints: penCurrentWaypoints.current,
        })
      }

      allBounds = allElement.current!.getBounds()
      gridBounds = gridElement.current!.getBounds()

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
      cellSizeFactor.current = Math.min(sx, sy) * (zoom + ZOOM_DELTA)
      cs = Math.floor(cellSize * cellSizeFactor.current)
    }

    let marginTop = gridBounds!.y - allBounds!.y
    let marginBottom =
      allBounds!.y + allBounds!.height - (gridBounds!.y + gridBounds!.height)
    let marginLeft = gridBounds!.x - allBounds!.x
    let marginRight =
      allBounds!.x + allBounds!.width - (gridBounds!.x + gridBounds!.width)
    let additionalMarginX = 0
    let additionalMarginY = 0
    if (portrait) {
      additionalMarginX = Math.abs(marginLeft - marginRight)
    } else {
      additionalMarginY = Math.abs(marginTop - marginBottom)
    }

    let w = allBounds!.width
    let h = allBounds!.height

    app.renderer.resize(w, h)
    allElement.current!.x = -allBounds!.x
    allElement.current!.y = -allBounds!.y

    if (marginTop > marginBottom) {
      ref.current!.style.marginTop = "0"
      ref.current!.style.marginBottom = `${additionalMarginY}px`
    } else {
      ref.current!.style.marginTop = `${additionalMarginY}px`
      ref.current!.style.marginBottom = "0"
    }
    if (marginLeft > marginRight) {
      ref.current!.style.marginLeft = "0"
      ref.current!.style.marginRight = `${additionalMarginX}px`
    } else {
      ref.current!.style.marginLeft = `${additionalMarginX}px`
      ref.current!.style.marginRight = "0"
    }
  }, [
    app,
    cellSize,
    maxWidth,
    maxHeight,
    portrait,
    theme,
    zoom,
    game.data,
    game.mode,
    game.digits,
    game.fogLights,
    game.fogRaster,
  ])

  // register keyboard handlers
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [onKeyDown])

  useEffect(() => {
    if (app === undefined) {
      return
    }

    let themeColours = getThemeColours(ref.current!)

    // optimised font sizes for different screens
    let fontSizeCornerMarks =
      window.devicePixelRatio >= 2
        ? FONT_SIZE_CORNER_MARKS_HIGH_DPI
        : FONT_SIZE_CORNER_MARKS_LOW_DPI
    let fontSizeCentreMarks =
      window.devicePixelRatio >= 2
        ? FONT_SIZE_CENTRE_MARKS_HIGH_DPI
        : FONT_SIZE_CENTRE_MARKS_LOW_DPI

    // scale fonts
    let fontSizeDigits = FONT_SIZE_DIGITS * fontSizeFactorDigits
    fontSizeCornerMarks *= fontSizeFactorCornerMarks
    fontSizeCentreMarks *= fontSizeFactorCentreMarks

    // change font size of digits
    for (let e of digitElements.current) {
      e.style.fontSize = Math.round(fontSizeDigits * cellSizeFactor.current)
    }

    // change font size of corner marks
    for (let e of cornerMarkElements.current) {
      for (let ce of e.elements) {
        ce.style.fontSize = Math.round(
          fontSizeCornerMarks * cellSizeFactor.current,
        )
      }
    }

    // change font size of centre marks
    for (let e of centreMarkElements.current) {
      e.style.fontSize = Math.round(
        fontSizeCentreMarks * cellSizeFactor.current,
      )
    }

    // change font size and colour of given corner marks
    for (let e of givenCornerMarkElements.current) {
      e.style.fontSize = Math.round(
        fontSizeCornerMarks * cellSizeFactor.current,
      )
      e.style.fill = themeColours.foregroundColor
    }

    // change selection colour
    for (let e of selectionElements.current) {
      e.fillStyle.color = themeColours.selection[selectionColour]
    }

    // change background colour
    backgroundElement.current!.clear()
    drawBackground(
      backgroundElement.current!,
      app.renderer.width,
      app.renderer.height,
      themeColours,
    )
  }, [
    app,
    theme,
    selectionColour,
    zoom,
    fontSizeFactorDigits,
    fontSizeFactorCentreMarks,
    fontSizeFactorCornerMarks,
    maxWidth,
    maxHeight,
    portrait,
    game.data,
    game.mode,
  ])

  useEffect(() => {
    selectionElements.current.forEach(s => {
      s.visible = game.selection.has(s.data!.k!)
    })
    renderNow()
  }, [game.selection, renderNow])

  useEffect(() => {
    if (app === undefined) {
      return
    }

    let themeColours = getThemeColours(ref.current!)
    let cornerMarks = new Map()
    let centreMarks = new Map()

    for (let e of cornerMarkElements.current) {
      let digits = game.cornerMarks.get(e.data.k)
      for (let ce of e.elements) {
        ce.visible = false
      }
      if (digits !== undefined) {
        for (let [i, d] of [...digits].sort().entries()) {
          let n = i
          if (digits.size > 8 && n > 4) {
            n++
          }
          e.elements[n].text = d
          e.elements[n].style.fill = themeColours.smallDigitColor
          e.elements[n].visible = true
        }
        cornerMarks.set(e.data.k, e)
      }
    }

    for (let e of centreMarkElements.current) {
      let digits = game.centreMarks.get(e.data!.k!)
      if (digits !== undefined) {
        e.text = [...digits].sort().join("")
        e.style.fill = themeColours.smallDigitColor
        e.visible = true
        centreMarks.set(e.data!.k!, e)
      } else {
        e.visible = false
      }
    }

    for (let e of digitElements.current) {
      let digit = game.digits.get(e.data!.k!)
      if (digit !== undefined) {
        let [x, y] = ktoxy(e.data!.k!)
        if (digit.given && !digit.discovered && hasFog(game.fogRaster, x, y)) {
          e.visible = false
        } else {
          e.text = digit.digit
          e.style.fill = digit.given
            ? themeColours.foregroundColor
            : themeColours.digitColor
          e.visible = true

          let com = cornerMarks.get(e.data!.k!)
          if (com !== undefined) {
            for (let ce of com.elements) {
              ce.visible = false
            }
          }

          let cem = centreMarks.get(e.data!.k!)
          if (cem !== undefined) {
            cem.visible = false
          }
        }
      } else {
        e.visible = false
      }
    }

    let scaledCellSize = Math.floor(cellSize * cellSizeFactor.current)
    let colours = []
    if (colourPalette !== "custom" || customColours.length === 0) {
      let computedStyle = getComputedStyle(ref.current!)
      let nColours = +computedStyle.getPropertyValue("--colors")
      for (let i = 0; i < nColours; ++i) {
        colours[i] = computedStyle.getPropertyValue(`--color-${i + 1}`)
      }
    } else {
      colours = customColours
    }
    for (let e of colourElements.current) {
      let colour = game.colours.get(e.data!.k!)
      if (colour !== undefined) {
        let palCol = colours[colour.colour - 1]
        if (palCol === undefined) {
          palCol = colours[1] || colours[0]
        }
        let colourNumber = getRGBColor(palCol)
        e.clear()
        e.rect(0.5, 0.5, scaledCellSize - 1, scaledCellSize - 1)
        e.fill(colourNumber)
        if (colourNumber === 0xffffff) {
          e.alpha = 1.0
        } else {
          e.alpha = 0.5
        }
      } else {
        e.alpha = 0
      }
    }

    for (let pl of penLineElements.current) {
      pl.visible = game.penLines.has(pl.data!.k!)
    }

    for (let e of errorElements.current) {
      e.visible = game.errors.has(e.data!.k!)
    }

    renderNow()

    if ("_SUDOCLE_IS_TEST" in window) {
      screenshotNow()
    }
  }, [
    app,
    cellSize,
    game.digits,
    game.cornerMarks,
    game.centreMarks,
    game.colours,
    game.penLines,
    game.errors,
    game.fogRaster,
    theme,
    colourPalette,
    selectionColour,
    customColours,
    zoom,
    fontSizeFactorDigits,
    fontSizeFactorCentreMarks,
    fontSizeFactorCornerMarks,
    maxWidth,
    maxHeight,
    portrait,
    renderNow,
    screenshotNow,
    game.mode,
    game.data,
  ])

  return (
    <div
      ref={ref}
      className="flex"
      onClick={onBackgroundClick}
      onDoubleClick={onDoubleClick}
    ></div>
  )
}

export default Grid
