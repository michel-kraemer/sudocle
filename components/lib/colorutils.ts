import Color from "color"

export function getRGBColor(colorString: string): number {
  return Color(colorString.trim()).rgbNumber()
}

export function getAlpha(colorString: string): number {
  return Color(colorString.trim()).alpha()
}
