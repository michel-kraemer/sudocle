import { Graphics } from "pixi.js"

// based on https://codepen.io/unrealnl/pen/aYaxBW by Erik
// published under the MIT license
export function drawDashedLineString(
  points: number[],
  dashArray: number[],
  dashOffset: number,
  graphics: Graphics,
) {
  let dashLeft = 0
  let gapLeft = 0
  let dai = 0

  if (dashOffset < 0) {
    let dashArrayLen = dashArray.reduce((a, b) => a + b, 0)
    dashOffset = dashArrayLen + dashOffset
  }

  if (dashOffset > 0) {
    let isDash = false
    while (dashOffset > 0) {
      isDash = !isDash
      dashOffset -= dashArray[dai]
      dai = (dai + 1) % dashArray.length
    }
    if (isDash) {
      dashLeft = -dashOffset
      dai = (dai + 1) % dashArray.length
    } else {
      gapLeft = -dashOffset
    }
  }

  for (let i = 0; i < points.length - 2; i += 2) {
    let p1x = points[i]
    let p1y = points[i + 1]
    let p2x = points[i + 2]
    let p2y = points[i + 3]

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
        progressOnLine += dashArray[dai]
      }
      dai = (dai + 1) % dashArray.length

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

      progressOnLine += dashArray[dai]
      dai = (dai + 1) % dashArray.length

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
