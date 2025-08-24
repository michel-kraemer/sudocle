import { euclidianBresenhamInterpolate } from "../lib/linestringutils"
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
  if (penCurrentDrawEdge) {
    right = PenLineType.EdgeRight
    down = PenLineType.EdgeDown
  } else {
    right = PenLineType.CenterRight
    down = PenLineType.CenterDown
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
  gamePenLines = new Set<number>()

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

  private onPenMove(
    e: FederatedPointerEvent,
    cellSize: number,
    gridOffset: { x: number; y: number },
  ) {
    if (e.target === null) {
      // pointer is not over the hit area
      return
    }
    if (e.buttons !== 1) {
      // let mouse button is not pressed
      return
    }

    let x = e.global.x - gridOffset.x
    let y = e.global.y - gridOffset.y

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
      if (dist <= (cellSize / 5) * 2) {
        this.currentDrawEdge = false
      } else {
        this.currentDrawEdge = true
        if (cellDX >= 0.5) {
          cellX++
        }
        if (cellDY >= 0.5) {
          cellY++
        }
      }
    } else {
      if (this.currentDrawEdge) {
        if (cellDX >= 0.5) {
          cellX++
        }
        if (cellDY >= 0.5) {
          cellY++
        }
      }
    }

    let k = xytok(cellX, cellY)

    if (this.currentWaypoints.length === 0) {
      this.currentWaypoints = [k]
    } else if (this.currentWaypoints[this.currentWaypoints.length - 1] === k) {
      // nothing to do
      return
    } else {
      this.currentWaypoints = produce(this.currentWaypoints, pcw => {
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
        width: 3 * SCALE_FACTOR,
        color,
        cap: "round",
        join: "round",
      })
    }
  }

  private updateHitArea(
    cellSize: number,
    gridOffset: { x: number; y: number },
  ) {
    this.hitAreaGraphics.hitArea = new Rectangle(
      0,
      0,
      this.cells[0].length * cellSize,
      this.cells.length * cellSize,
    )

    this.hitAreaGraphics.removeAllListeners()
    this.hitAreaGraphics.on("pointermove", e =>
      this.onPenMove(e, cellSize, gridOffset),
    )
  }

  draw(options: { cellSize: number; gridOffset: { x: number; y: number } }) {
    this.updateWayPoints(options.cellSize)
    this.updateHitArea(options.cellSize, options.gridOffset)
  }
}

export default PenElement
