function cellToCell(cell, offsetX = 0, offsetY = 0) {
  let m = cell.match(/R([0-9]+)C([0-9]+)/)
  return [+m[1] - 1 + offsetX, +m[2] - 1 + offsetY]
}

export function convertFPuzzle(puzzle) {
  let cells = puzzle.grid.map(row => row.map(col => ({ value: col.value })))

  // default regions
  let regions = []
  for (let c = 0; c < 3; ++c) {
    for (let r = 0; r < 3; ++r) {
      let box = []
      for (let x = 0; x < 3; ++x) {
        for (let y = 0; y < 3; ++y) {
          box.push([x + r * 3, y + c * 3])
        }
      }
      regions.push(box)
    }
  }

  let cages = []
  if (puzzle.killercage !== undefined && puzzle.killercage !== null) {
    for (let cage of puzzle.killercage) {
      cages.push({
        cells: cage.cells.map(c => cellToCell(c)),
        value: cage.value
      })
    }
  }

  if (puzzle.title) {
    cages.push({
      cells: [],
      value: `title: ${puzzle.title}`
    })
  }

  if (puzzle.author) {
    cages.push({
      cells: [],
      value: `author: ${puzzle.author}`
    })
  }

  if (puzzle.ruleset) {
    cages.push({
      cells: [],
      value: `rules: ${puzzle.ruleset}`
    })
  }

  let lines = []

  if (puzzle["diagonal+"]) {
    lines.push({
      "wayPoints": [
          [0, 9],
          [9, 0]
      ],
      "color": "#34BBE6",
      "thickness": 1
    })
  }

  if (puzzle["diagonal-"]) {
    lines.push({
      "wayPoints": [
          [0, 0],
          [9, 9]
      ],
      "color": "#34BBE6",
      "thickness": 1
    })
  }

  let underlays = []

  if (puzzle.even !== undefined && puzzle.even !== null) {
    for (let e of puzzle.even) {
      underlays.push({
        "center": cellToCell(e.cell, 0.5, 0.5),
        "width": 0.8,
        "height": 0.8,
        "borderColor": "#CFCFCF",
        "backgroundColor": "#CFCFCF",
        "rounded": false
      })
    }
  }

  let arrows = []

  if (puzzle.arrow !== undefined && puzzle.arrow !== null) {
    for (let a of puzzle.arrow) {
      if (a.cells !== undefined && a.cells !== null) {
        for (let c of a.cells) {
          underlays.push({
            "center": cellToCell(c, 0.5, 0.5),
            "width": 0.7,
            "height": 0.7,
            "borderColor": "#CFCFCF",
            "backgroundColor": "#FFFFFF",
            "rounded": true
          })
        }
      }
      if (a.lines !== undefined && a.lines !== null) {
        for (let l of a.lines) {
          let newArrow = {
            "wayPoints": l.map(c => cellToCell(c, 0.5, 0.5)),
            "color": "#CFCFCF",
            "thickness": 2,
            "headLength": 0.3
          }
          if (a.cells !== undefined && a.cells !== null && l.length > 1 && a.cells.indexOf(l[0]) >= 0) {
            let l0 = cellToCell(l[0])
            let l1 = cellToCell(l[1])
            let dx = l1[0] - l0[0]
            let dy = l1[1] - l0[1]
            if (dx !== 0 && dy !== 0) {
              newArrow.wayPoints[0][0] += 0.21 * dx
              newArrow.wayPoints[0][1] += 0.21 * dy
            } else if (dx === 0 && dy !== 0) {
              newArrow.wayPoints[0][0] += 0.31 * dy
            } else if (dy === 0 && dx !== 0) {
              newArrow.wayPoints[0][1] += 0.31 * dx
            }
          }
          arrows.push(newArrow)
        }
      }
    }
  }

  let result = {
    cellSize: 50,
    cells,
    regions,
    cages,
    lines,
    underlays,
    arrows
  }

  return result
}
