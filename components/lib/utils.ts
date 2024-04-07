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

export function hasFog(
  fogRaster: number[][] | undefined,
  x: number,
  y: number
): boolean {
  if (fogRaster !== undefined) {
    return fogRaster[y]?.[x] === 1
  }
  return false
}
