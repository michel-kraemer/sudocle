import { Data } from "../types/Data"

export interface CellExtent {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function add(extent: CellExtent, cells: [number, number][]) {
  for (let cell of cells) {
    let y = cell[0]
    let x = cell[1]
    extent.minX = Math.min(extent.minX, x)
    extent.minY = Math.min(extent.minY, y)
    extent.maxX = Math.max(extent.maxX, x)
    extent.maxY = Math.max(extent.maxY, y)
  }
}

export function calculateCellExtent(data: Data): CellExtent {
  let minX = 0
  let minY = 0
  let maxX = data.cells.length > 0 ? data.cells[0].length : 0
  let maxY = data.cells.length

  let r = { minX, minY, maxX, maxY }

  for (let line of data.gridLines) {
    add(r, line.wayPoints)
  }

  for (let region of data.regions) {
    add(r, region)
  }

  for (let cage of data.cages) {
    if (cage.cells !== undefined) {
      add(r, cage.cells)
    }
  }

  for (let line of data.lines) {
    add(r, line.wayPoints)
  }

  if (data.extraRegions !== undefined) {
    for (let region of data.extraRegions) {
      add(r, region.cells)
    }
  }

  for (let arrow of data.arrows) {
    add(r, arrow.wayPoints)
  }

  for (let underlay of data.underlays) {
    add(r, [underlay.center])
  }

  for (let overlay of data.overlays) {
    if ("wayPoints" in overlay) {
      add(r, overlay.wayPoints)
    } else {
      add(r, [overlay.center])
    }
  }

  if (data.fogLights !== undefined) {
    for (let light of data.fogLights) {
      add(r, [light.center])
    }
  }

  return r
}
