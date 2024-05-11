import { getAlpha, getRGBColor } from "../lib/colorutils"
import { drawDashedLineString } from "../lib/linestringutils"
import { cellToScreenCoords } from "../lib/utils"
import { Arrow, Line, Overlay } from "../types/Data"
import { SCALE_FACTOR } from "./Grid"
import { GridElement } from "./GridElement"
import { flatten, isEqual } from "lodash"
import { Container, Graphics } from "pixi.js"

class BaseLineElement<T extends Line | Arrow> implements GridElement {
  protected readonly baseLine: T
  protected readonly shortenStart: boolean
  protected readonly shortenEnd: boolean
  readonly container: Container
  protected readonly lineGraphics: Graphics

  constructor(baseLine: T, shortenStart: boolean, shortenEnd: boolean) {
    this.baseLine = baseLine
    this.shortenStart = shortenStart
    this.shortenEnd = shortenEnd

    this.lineGraphics = new Graphics()
    this.lineGraphics.alpha = getAlpha(baseLine.color)

    this.container = new Container()
    this.container.addChild(this.lineGraphics)
  }

  protected static isReverseEqual(
    a: [number, number][],
    b: [number, number][],
  ): boolean {
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

  // do not shorten:
  // * connected lines of same colour and thickness
  // * dashed lines
  protected static needsLineShortening(
    line: Line,
    allLines: Line[],
  ): { shortenStart: boolean; shortenEnd: boolean } {
    if (line.wayPoints.length < 2) {
      return { shortenStart: false, shortenEnd: false }
    }
    if ("strokeDashArray" in line) {
      // don't shorten dashed lines
      return { shortenStart: false, shortenEnd: false }
    }
    let shortenStart = true
    let shortenEnd = true
    let first = line.wayPoints[0]
    let last = line.wayPoints[line.wayPoints.length - 1]
    for (let o of allLines) {
      if (
        isEqual(o.wayPoints, line.wayPoints) ||
        BaseLineElement.isReverseEqual(o.wayPoints, line.wayPoints) ||
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
  protected static shortenLine(
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

  protected static filterDuplicatePoints(points: number[]): number[] {
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

  // see https://mathworld.wolfram.com/Circle-LineIntersection.html
  protected static closestLineCircleIntersection(
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

  protected static snapLineToCircle<T extends Arrow | Line>(
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
        let i = BaseLineElement.closestLineCircleIntersection(
          first,
          second,
          o.center,
          radius,
        )
        if (i !== undefined) {
          // shorten just a little bit to accomodate for rounded line ends
          let si = BaseLineElement.shortenLine(
            [...i, ...second],
            true,
            false,
            a.thickness / 200,
          )
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

  clear() {
    this.lineGraphics.clear()
  }

  protected drawLineGraphics(
    points: number[],
    strokeDashArray?: number[],
    strokeDashOffset?: number,
  ) {
    if (strokeDashArray !== undefined) {
      drawDashedLineString(
        points,
        strokeDashArray,
        strokeDashOffset ?? 0,
        this.lineGraphics,
      )
    } else {
      let lvx = 0
      let lvy = 0
      this.lineGraphics.moveTo(points[0], points[1])
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
          this.lineGraphics.moveTo(points[i - 2], points[i - 1])
        }

        this.lineGraphics.lineTo(points[i], points[i + 1])

        lvx = vx
        lvy = vy
      }
    }

    this.lineGraphics.stroke({
      width: this.baseLine.thickness * SCALE_FACTOR,
      color: getRGBColor(this.baseLine.color),
      cap: "round",
      join: "round",
    })
  }

  protected getPoints(
    cellSize: number,
    gridOffset: { x: number; y: number },
  ): number[] {
    return BaseLineElement.shortenLine(
      BaseLineElement.filterDuplicatePoints(
        flatten(
          this.baseLine.wayPoints.map(wp =>
            cellToScreenCoords(wp, gridOffset.x, gridOffset.y, cellSize),
          ),
        ),
      ),
      this.shortenStart,
      this.shortenEnd,
    )
  }

  draw(options: {
    cellSize: number
    unitSize: number
    gridOffset: { x: number; y: number }
  }): void {
    if ("strokeDashArray" in this.baseLine) {
      this.drawLineGraphics(
        this.getPoints(options.cellSize, options.gridOffset),
        this.baseLine.strokeDashArray?.map(v => v * options.unitSize),
        this.baseLine.strokeDashOffset !== undefined
          ? this.baseLine.strokeDashOffset * options.unitSize
          : undefined,
      )
    } else {
      this.drawLineGraphics(
        this.getPoints(options.cellSize, options.gridOffset),
      )
    }
  }
}

export default BaseLineElement
