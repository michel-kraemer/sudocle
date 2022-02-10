export function eqCell(a, b) {
  return a.row === b.row && a.col === b.col
}

export function ctok(c) {
  return xytok(c.col, c.row)
}

export function xytok(x, y) {
  return x << 24 | y
}

export function ktoxy(c) {
  return [c >> 24, c & 0xfff]
}

export function pltok(x, y, type) {
  return x << 20 | y << 8 | type
}
