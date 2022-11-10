// group 0
export const MODE_NORMAL = "normal"
export const MODE_CORNER = "corner"
export const MODE_CENTRE = "centre"
export const MODE_COLOUR = "colour"

// group 1
export const MODE_PEN = "pen"

export function getModeGroup(mode: string): number {
  switch (mode) {
    case MODE_NORMAL:
    case MODE_CORNER:
    case MODE_CENTRE:
    case MODE_COLOUR:
      return 0

    default:
    // case MODE_PEN:
      return 1
  }
}
