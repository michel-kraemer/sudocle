import { flatten } from "lodash"
import polygonClipping, { Polygon } from "polygon-clipping"

interface Cell {
  row: number
  col: number
}

export function eqCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col
}

export function ctok(c: Cell): number {
  return xytok(c.col, c.row)
}

export function xytok(x: number, y: number): number {
  return (x << 24) | y
}

export function ktoxy(c: number): [number, number] {
  return [c >> 24, c & 0xfff]
}

export function pltok(x: number, y: number, type: number): number {
  return (x << 20) | (y << 8) | type
}

export function ktopl(k: number): [number, number, number] {
  return [k >> 20, (k >> 8) & 0xfff, k & 0xff]
}

export function hasFog(
  fogRaster: number[][] | undefined,
  x: number,
  y: number,
): boolean {
  if (fogRaster !== undefined) {
    return fogRaster[y]?.[x] === 1
  }
  return false
}

export function cellToScreenCoords(
  cell: [number, number],
  mx: number,
  my: number,
  cellSize: number,
): [number, number] {
  return [cell[1] * cellSize + mx, cell[0] * cellSize + my]
}

export function unionCells(cells: [number, number][]): number[][][] {
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

// Parse strings in the form "RyCx..." to coordinates [[y,x],...]
export function parseCells(cells: string): [number, number][] {
  let r = new RegExp(/R([0-9]+)C([0-9]+)/gi)
  let result: [number, number][] = []
  for (let m of cells.matchAll(r)) {
    result.push([+m[1] - 1, +m[2] - 1])
  }
  return result
}
