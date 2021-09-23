import { chunk, mean } from "lodash"

function cellToCell(cell, offsetX = 0.5, offsetY = 0.5) {
  let m = cell.match(/R([0-9]+)C([0-9]+)/)
  return [+m[1] - 1 + offsetX, +m[2] - 1 + offsetY]
}

function fixLineConnector(l0, l1, wp) {
  l0 = cellToCell(l0, 0, 0)
  l1 = cellToCell(l1, 0, 0)
  let dx = l1[0] - l0[0]
  let dy = l1[1] - l0[1]
  if (dx !== 0 && dy !== 0) {
    wp[0] += 0.21 * dx
    wp[1] += 0.21 * dy
  } else if (dx === 0 && dy !== 0) {
    wp[1] += 0.31 * dy
  } else if (dy === 0 && dx !== 0) {
    wp[0] += 0.31 * dx
  }
}

function convertMinMax(m, isMax, arrows, underlays) {
  let center = cellToCell(m.cell)
  let newArrows = []
  newArrows.push({
    wayPoints: [
      [center[0] - 0.3, center[1]],
      [center[0] - 0.5, center[1]]
    ],
    color: "#000000",
    thickness: 1,
    headLength: 0.3
  })
  newArrows.push({
    wayPoints: [
      [center[0] + 0.3, center[1]],
      [center[0] + 0.5, center[1]]
    ],
    color: "#000000",
    thickness: 1,
    headLength: 0.3
  })
  newArrows.push({
    wayPoints: [
      [center[0], center[1] - 0.3],
      [center[0], center[1] - 0.5]
    ],
    color: "#000000",
    thickness: 1,
    headLength: 0.3
  })
  newArrows.push({
    wayPoints: [
      [center[0], center[1] + 0.3],
      [center[0], center[1] + 0.5]
    ],
    color: "#000000",
    thickness: 1,
    headLength: 0.3
  })

  for (let na of newArrows) {
    if (!isMax) {
      let wp0 = na.wayPoints[0]
      na.wayPoints[0] = na.wayPoints[1]
      na.wayPoints[1] = wp0
    }
    arrows.push(na)
  }

  underlays.push({
    center,
    width: 1,
    height: 1,
    borderColor: "#CFCFCF",
    backgroundColor: "#CFCFCF",
    rounded: false
  })
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
  let killercages = [...(puzzle.killercage || []), ...(puzzle.cage || [])]
  for (let cage of killercages) {
    cages.push({
      cells: cage.cells.map(c => cellToCell(c, 0, 0)),
      value: cage.value
    })
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
      wayPoints: [
          [0, 9],
          [9, 0]
      ],
      color: "#34BBE6",
      thickness: 1
    })
  }

  if (puzzle["diagonal-"]) {
    lines.push({
      wayPoints: [
          [0, 0],
          [9, 9]
      ],
      color: "#34BBE6",
      thickness: 1
    })
  }

  if (puzzle.line !== undefined && puzzle.line !== null) {
    for (let l of puzzle.line) {
      for (let m of l.lines) {
        lines.push({
          wayPoints: m.map(c => cellToCell(c)),
          color: l.outlineC || "#000000",
          thickness: (l.width || 0.05) * 20
        })
      }
    }
  }

  let underlays = []

  if (puzzle.odd !== undefined && puzzle.odd !== null) {
    for (let e of puzzle.odd) {
      underlays.push({
        center: cellToCell(e.cell),
        width: 0.8,
        height: 0.8,
        borderColor: "#CFCFCF",
        backgroundColor: "#CFCFCF",
        rounded: true
      })
    }
  }

  if (puzzle.even !== undefined && puzzle.even !== null) {
    for (let e of puzzle.even) {
      underlays.push({
        center: cellToCell(e.cell),
        width: 0.8,
        height: 0.8,
        borderColor: "#CFCFCF",
        backgroundColor: "#CFCFCF",
        rounded: false
      })
    }
  }

  let arrows = []

  if (puzzle.arrow !== undefined && puzzle.arrow !== null) {
    for (let a of puzzle.arrow) {
      if (a.cells !== undefined && a.cells !== null) {
        for (let c of a.cells) {
          underlays.push({
            center: cellToCell(c),
            width: 0.7,
            height: 0.7,
            borderColor: "#CFCFCF",
            backgroundColor: "#FFFFFF",
            rounded: true
          })
        }
      }
      if (a.lines !== undefined && a.lines !== null) {
        for (let l of a.lines) {
          let newArrow = {
            wayPoints: l.map(c => cellToCell(c)),
            color: "#CFCFCF",
            thickness: 2,
            headLength: 0.3
          }
          if (a.cells !== undefined && a.cells !== null && l.length > 1 && a.cells.indexOf(l[0]) >= 0) {
            fixLineConnector(l[0], l[1], newArrow.wayPoints[0])
          }
          arrows.push(newArrow)
        }
      }
    }
  }

  let overlays = []

  if (puzzle.littlekillersum !== undefined && puzzle.littlekillersum !== null) {
    for (let l of puzzle.littlekillersum) {
      let center = cellToCell(l.cell)
      let arrow
      if (l.direction === "UR") {
        arrow = {
          wayPoints: [[center[0] - 0.05, center[1] + 0.05], [center[0] - 0.5, center[1] + 0.5]],
          color: "#CFCFCF",
          thickness: 5,
          headLength: 0.3
        }
      } else if (l.direction === "DR") {
        arrow = {
          wayPoints: [[center[0] + 0.05, center[1] + 0.05], [center[0] + 0.5, center[1] + 0.5]],
          color: "#CFCFCF",
          thickness: 5,
          headLength: 0.3
        }
      } else if (l.direction === "UL") {
        arrow = {
          wayPoints: [[center[0] - 0.05, center[1] - 0.05], [center[0] - 0.5, center[1] - 0.5]],
          color: "#CFCFCF",
          thickness: 5,
          headLength: 0.3
        }
      } else if (l.direction === "DL") {
        arrow = {
          wayPoints: [[center[0] + 0.05, center[1] - 0.05], [center[0] + 0.5, center[1] - 0.5]],
          color: "#CFCFCF",
          thickness: 5,
          headLength: 0.3
        }
      }
      overlays.push({
        center,
        width: 0.5,
        height: 0.5,
        rounded: false,
        fontSize: 20,
        text: l.value
      })
      arrows.push(arrow)
    }
  }

  if (puzzle.quadruple !== undefined && puzzle.quadruple !== null) {
    for (let q of puzzle.quadruple) {
      let centers = q.cells.map(c => cellToCell(c))
      let avgx = mean(centers.map(c => c[0]))
      let avgy = mean(centers.map(c => c[1]))

      let texts = chunk(q.values, 2).map(c => c.join("\u2009"))
      let fontSize = 15
      if (q.values.length > 0) {
        fontSize = 13
      }
      if (q.values.length > 2) {
        fontSize = 10
      }
      overlays.push({
        center: [avgx, avgy],
        width: 0.6,
        height: 0.6,
        borderColor: "#000000",
        backgroundColor: "#FFFFFF",
        rounded: true,
        fontSize: fontSize,
        text: ""
      })
      for (let t = 0; t < texts.length; ++t) {
        let dx = (t - (texts.length - 1) / 2) * 0.19
        overlays.push({
          center: [avgx + dx, avgy],
          width: 0.6,
          height: 0.6,
          rounded: true,
          fontSize: fontSize,
          text: texts[t]
        })
      }
    }
  }

  if (puzzle.palindrome !== undefined && puzzle.palindrome !== null) {
    for (let p of puzzle.palindrome) {
      for (let l of p.lines) {
        lines.push({
          wayPoints: l.map(c => cellToCell(c)),
          color: "#CFCFCF",
          thickness: 10
        })
      }
    }
  }

  if (puzzle.betweenline !== undefined && puzzle.betweenline !== null) {
    for (let b of puzzle.betweenline) {
      for (let l of b.lines) {
        if (l.length > 1) {
          let newLine = {
            wayPoints: l.map(c => cellToCell(c)),
            color: "#D23BE7",
            thickness: 2
          }

          fixLineConnector(l[0], l[1], newLine.wayPoints[0])
          fixLineConnector(l[l.length - 1], l[l.length - 2], newLine.wayPoints[l.length - 1])

          lines.push(newLine)

          underlays.push({
            center: cellToCell(l[0]),
            width: 0.7,
            height: 0.7,
            borderColor: "#000000",
            backgroundColor: "#CFCFCF",
            rounded: true
          })
          underlays.push({
            center: cellToCell(l[l.length - 1]),
            width: 0.7,
            height: 0.7,
            borderColor: "#000000",
            backgroundColor: "#CFCFCF",
            rounded: true
          })
        }
      }
    }
  }

  if (puzzle.minimum !== undefined && puzzle.minimum !== null) {
    for (let m of puzzle.minimum) {
      convertMinMax(m, false, arrows, underlays)
    }
  }

  if (puzzle.maximum !== undefined && puzzle.maximum !== null) {
    for (let m of puzzle.maximum) {
      convertMinMax(m, true, arrows, underlays)
    }
  }

  if (puzzle.difference !== undefined && puzzle.difference !== null) {
    for (let r of puzzle.difference) {
      let cells = r.cells.map(c => cellToCell(c))
      let center = [mean(cells.map(c => c[0])), mean(cells.map(c => c[1]))]
      overlays.push({
        center,
        width: 0.3,
        height: 0.3,
        borderColor: "#000000",
        backgroundColor: "#FFFFFF",
        rounded: true,
        fontSize: 16,
        text: ""
      })
    }
  }

  if (puzzle.ratio !== undefined && puzzle.ratio !== null) {
    for (let r of puzzle.ratio) {
      let cells = r.cells.map(c => cellToCell(c))
      let center = [mean(cells.map(c => c[0])), mean(cells.map(c => c[1]))]
      overlays.push({
        center,
        width: 0.3,
        height: 0.3,
        borderColor: "#000000",
        backgroundColor: "#000000",
        rounded: true,
        fontSize: 16,
        text: ""
      })
    }
  }

  if (puzzle.xv !== undefined && puzzle.xv !== null) {
    for (let xv of puzzle.xv) {
      let cells = xv.cells.map(c => cellToCell(c))
      let center = [mean(cells.map(c => c[0])), mean(cells.map(c => c[1]))]
      overlays.push({
        center,
        width: 0.25,
        height: 0.25,
        borderColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
        rounded: false,
        fontSize: 16,
        text: xv.value
      })
    }
  }

  if (puzzle.sandwichsum !== undefined && puzzle.sandwichsum !== null) {
    for (let s of puzzle.sandwichsum) {
      let center = cellToCell(s.cell)
      overlays.push({
        center,
        width: 0.85,
        height: 0.85,
        backgroundColor: "#FFFFFF",
        rounded: true,
        fontSize: 20,
        text: s.value
      })
    }
  }

  if (puzzle.circle !== undefined && puzzle.circle !== null) {
    for (let circ of puzzle.circle) {
      let cells = circ.cells.map(c => cellToCell(c))
      let center = [mean(cells.map(c => c[0])), mean(cells.map(c => c[1]))]
      overlays.push({
        center,
        width: circ.width,
        height: circ.height,
        borderColor: circ.outlineC,
        backgroundColor: circ.baseC,
        rounded: true,
        fontSize: 20
      })
    }
  }

  if (puzzle.thermometer !== undefined && puzzle.thermometer !== null) {
    for (let t of puzzle.thermometer) {
      if (t.lines !== undefined && t.lines !== null) {
        for (let l of t.lines) {
          lines.push({
            wayPoints: l.map(c => cellToCell(c)),
            color: "#CFCFCF",
            thickness: 10
          })
          overlays.push({
            center: cellToCell(l[0]),
            width: 0.65,
            height: 0.65,
            borderColor: "#CFCFCF",
            backgroundColor: "#CFCFCF",
            rounded: true
          })
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
    overlays,
    underlays,
    arrows
  }

  return result
}
