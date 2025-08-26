import { Colour } from "../hooks/useGame"
import { bresenhamInterpolate } from "../lib/linestringutils"
import { ktoxy, pltok, xytok } from "../lib/utils"
import { DataCell } from "../types/Data"
import { SCALE_FACTOR } from "./Grid"
import { GridElement } from "./GridElement"
import { PenLineType } from "./PenLineElement"
import { produce } from "immer"
import { Container, FederatedPointerEvent, Graphics, Rectangle } from "pixi.js"

function penWaypointsToKey(
  wp1: number,
  wp2: number,
  penCurrentDrawEdge: boolean,
): number | undefined {
  let right
  let down
  let rightUp
  let rightDown
  if (penCurrentDrawEdge) {
    right = PenLineType.EdgeRight
    rightUp = PenLineType.EdgeRightUp
    rightDown = PenLineType.EdgeRightDown
    down = PenLineType.EdgeDown
  } else {
    right = PenLineType.CenterRight
    rightUp = PenLineType.CenterRightUp
    rightDown = PenLineType.CenterRightDown
    down = PenLineType.CenterDown
  }
  let p1 = ktoxy(wp1)
  let p2 = ktoxy(wp2)
  if (p2[0] > p1[0]) {
    if (p2[1] < p1[1]) {
      if (penCurrentDrawEdge) {
        return pltok(p1[0], p1[1] - 1, rightUp)
      }
      return pltok(p1[0], p1[1], rightUp)
    } else if (p2[1] > p1[1]) {
      return pltok(p1[0], p1[1], rightDown)
    } else {
      return pltok(p1[0], p1[1], right)
    }
  } else if (p2[0] < p1[0]) {
    if (p2[1] < p1[1]) {
      return pltok(p2[0], p2[1], rightDown)
    } else if (p2[1] > p1[1]) {
      if (penCurrentDrawEdge) {
        return pltok(p2[0], p2[1] - 1, rightUp)
      }
      return pltok(p2[0], p2[1], rightUp)
    } else {
      return pltok(p2[0], p2[1], right)
    }
  } else if (p2[1] > p1[1]) {
    return pltok(p1[0], p1[1], down)
  } else if (p2[1] < p1[1]) {
    return pltok(p2[0], p2[1], down)
  }
  return undefined
}

class PenElement implements GridElement {
  container: Container
  private readonly wayPointsGraphics: Graphics
  private readonly hitAreaGraphics: Graphics
  private readonly cells: DataCell[][]
  private readonly renderNow: () => void
  private lastCellSize = 1
  private currentDrawEdge = false
  private currentAdd = true
  private currentWaypoints: number[] = []
  gamePenLines = new Map<number, Colour>()

  constructor(cells: DataCell[][], renderNow: () => void) {
    this.cells = cells
    this.renderNow = renderNow

    // create element that visualises current waypoints
    this.wayPointsGraphics = new Graphics()

    // create hit area
    this.hitAreaGraphics = new Graphics()
    this.hitAreaGraphics.eventMode = "static"
    this.hitAreaGraphics.cursor = "crosshair"
    this.hitAreaGraphics.zIndex = 1
    this.hitAreaGraphics.visible = false

    this.container = new Container()
    this.container.addChild(this.wayPointsGraphics)
    this.container.addChild(this.hitAreaGraphics)
  }

  clear() {
    this.wayPointsGraphics.clear()
    this.hitAreaGraphics.clear()
  }

  set active(active: boolean) {
    this.hitAreaGraphics.visible = active
    this.currentWaypoints = []
  }

  onPointerUp(): { penLines: number[]; add: boolean } {
    let penLines = []
    for (let i = 0; i < this.currentWaypoints.length - 1; ++i) {
      let k = penWaypointsToKey(
        this.currentWaypoints[i],
        this.currentWaypoints[i + 1],
        this.currentDrawEdge,
      )
      if (k !== undefined) {
        penLines.push(k)
      }
    }
    let add = this.currentAdd

    this.currentDrawEdge = false
    this.currentAdd = true
    this.currentWaypoints = []
    this.updateWayPoints()

    return { penLines, add }
  }

  private onPenMove(e: FederatedPointerEvent, cellSize: number) {
    if (e.target === null) {
      // pointer is not over the hit area
      return
    }
    if (e.buttons !== 1) {
      // let mouse button is not pressed
      return
    }

    let { x, y } = e.getLocalPosition(this.container)

    let fCellX = x / cellSize
    let fCellY = y / cellSize
    let cellX = Math.floor(fCellX)
    let cellY = Math.floor(fCellY)
    let cellDX = fCellX - cellX
    let cellDY = fCellY - cellY

    if (this.currentWaypoints.length === 0) {
      // snap to cell edge or cell center
      let cellCenterX = cellX * cellSize + cellSize / 2
      let cellCenterY = cellY * cellSize + cellSize / 2
      let dist = Math.hypot(cellCenterX - x, cellCenterY - y)
      // `(cellSize / 5) * 2` appears to be a radius that works pretty good in
      // practice, i.e. a radius with which the tool behaves as the user expects
      // in almost all cases
      this.currentDrawEdge = dist > (cellSize / 5) * 2
    }

    if (this.currentDrawEdge) {
      if (cellDX > 0.5) {
        cellX++
      }
      if (cellDY > 0.5) {
        cellY++
      }
    }

    let k = xytok(cellX, cellY)

    if (this.currentWaypoints.length === 0) {
      this.currentWaypoints = [k]
    } else if (this.currentWaypoints[this.currentWaypoints.length - 1] === k) {
      // nothing to do
      return
    } else {
      let previousWaypoint =
        this.currentWaypoints[this.currentWaypoints.length - 1]
      let previousWaypointPoint = ktoxy(previousWaypoint)
      let previousWaypointCellX = previousWaypointPoint[0]
      let previousWaypointCellY = previousWaypointPoint[1]
      let previousWaypointX = previousWaypointCellX * cellSize
      let previousWaypointY = previousWaypointCellY * cellSize
      if (!this.currentDrawEdge) {
        previousWaypointX += cellSize / 2
        previousWaypointY += cellSize / 2
      }

      // don't do anything if we've moved diagonally but not enough yet, for
      // example if we've moved right down but only crossed the edge to the
      // right but not the one to the bottom yet
      let dx = x - previousWaypointX
      let dy = y - previousWaypointY
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI
      if (angle >= 45 - 22.5 && angle <= 45 + 22.5) {
        // right down
        if (dx <= cellSize / 2 || dy <= cellSize / 2) {
          return
        }
      } else if (angle >= 135 - 22.5 && angle <= 135 + 22.5) {
        // left down
        if (-dx <= cellSize / 2 || dy <= cellSize / 2) {
          return
        }
      } else if (angle <= -45 + 22.5 && angle >= -45 - 22.5) {
        // right up
        if (dx <= cellSize / 2 || -dy <= cellSize / 2) {
          return
        }
      } else if (angle <= -135 + 22.5 && angle >= -135 - 22.5) {
        // left up
        if (-dx <= cellSize / 2 || -dy <= cellSize / 2) {
          return
        }
      }

      this.currentWaypoints = produce(this.currentWaypoints, pcw => {
        let toAdd = []
        if (pcw.length > 0) {
          let dx = Math.abs(cellX - previousWaypointCellX)
          let dy = Math.abs(cellY - previousWaypointCellY)
          if (dx + dy !== 1) {
            // cursor was moved diagonally or jumped to a distant cell
            // interpolate between the last cell and the new one
            let interpolated = bresenhamInterpolate(
              previousWaypointCellX,
              previousWaypointCellY,
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
      })

      // check if we are adding a pen line or removing it
      if (this.currentWaypoints.length > 1) {
        let firstKey = penWaypointsToKey(
          this.currentWaypoints[0],
          this.currentWaypoints[1],
          this.currentDrawEdge,
        )
        this.currentAdd =
          firstKey === undefined || !this.gamePenLines.has(firstKey)
      }
    }

    // render waypoints
    this.updateWayPoints()
    this.renderNow()
  }

  private updateWayPoints(cellSize?: number) {
    let cs = cellSize ?? this.lastCellSize
    this.lastCellSize = cs

    this.wayPointsGraphics.clear()
    if (this.currentWaypoints.length > 1) {
      let color
      if (this.currentAdd) {
        color = 0x009e73
      } else {
        color = 0xde3333
      }
      let d = 0.5
      if (this.currentDrawEdge) {
        d = 0
      }
      let p0 = ktoxy(this.currentWaypoints[0])
      this.wayPointsGraphics.moveTo((p0[0] + d) * cs, (p0[1] + d) * cs)
      for (let i = 0; i < this.currentWaypoints.length - 1; ++i) {
        let p = ktoxy(this.currentWaypoints[i + 1])
        this.wayPointsGraphics.lineTo((p[0] + d) * cs, (p[1] + d) * cs)
      }
      this.wayPointsGraphics.stroke({
        width: 5 * SCALE_FACTOR,
        color,
        cap: "round",
        join: "round",
      })
    }
  }

  private updateHitArea(cellSize: number) {
    this.hitAreaGraphics.hitArea = new Rectangle(
      0,
      0,
      this.cells[0].length * cellSize,
      this.cells.length * cellSize,
    )

    this.hitAreaGraphics.removeAllListeners()
    this.hitAreaGraphics.on("pointermove", e => this.onPenMove(e, cellSize))
  }

  draw(options: { cellSize: number }) {
    this.updateWayPoints(options.cellSize)
    this.updateHitArea(options.cellSize)
  }
}

export default PenElement
