// shrink polygon inwards by distance `d`
export function shrinkPolygon(points: number[], d: number): number[] {
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
export function disposePolygon(
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
