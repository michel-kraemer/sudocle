// group 0
const MODE_NORMAL = "normal"
const MODE_CORNER = "corner"
const MODE_CENTRE = "centre"
const MODE_COLOUR = "colour"

// group 1
const MODE_PEN = "pen"

module.exports = {
  // group 0
  MODE_NORMAL,
  MODE_CORNER,
  MODE_CENTRE,
  MODE_COLOUR,

  // group 1
  MODE_PEN,

  getModeGroup(mode) {
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
}
