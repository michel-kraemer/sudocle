import Color from "color"

export function getRGBColor(colorString: string): number {
  return Color(colorString.trim()).rgbNumber()
}

export function getAlpha(colorString: string): number {
  return Color(colorString.trim()).alpha()
}

export function isGrey(nColour: number): boolean {
  let r = (nColour >> 16) & 0xff
  let g = (nColour >> 8) & 0xff
  let b = nColour & 0xff
  return r === g && r === b
}
