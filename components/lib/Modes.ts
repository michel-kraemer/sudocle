// group 0
export const MODE_NORMAL = "normal"
export const MODE_CORNER = "corner"
export const MODE_CENTRE = "centre"
export const MODE_COLOUR = "colour"

// group 1
export const MODE_PEN = "pen"

export type Mode = typeof MODE_NORMAL | typeof MODE_CORNER |
  typeof MODE_CENTRE | typeof MODE_COLOUR | typeof MODE_PEN

export type MODE_GROUP = 0 | 1

export function getModeGroup(mode: Mode): MODE_GROUP {
  switch (mode) {
    case MODE_NORMAL:
    case MODE_CORNER:
    case MODE_CENTRE:
    case MODE_COLOUR:
      return 0

    case MODE_PEN:
      return 1
  }
}
