import { chunk, mean, isString } from "lodash"
import {
  Arrow,
  Cage,
  Data,
  DataCell,
  ExtraRegion,
  FogLight,
  Line,
  Metadata,
  Overlay
} from "../types/Data"

interface FPuzzlesCell {
  value?: number | string
  cornerPencilMarks?: (number | string)[]
  centerPencilMarks?: (number | string)[]
  given?: boolean
  region?: number
  c?: string
}

interface FPuzzlesCage {
  cells: string[]
  value: number | string
  outlineC?: string
}

interface FPuzzlesColumnIndexer {
  cells: string[]
}

interface FPuzzlesMinMax {
  cell: string
}

interface FPuzzlesLine {
  lines: string[][]
  outlineC?: string
  width?: number
}

interface FPuzzlesClone {
  cells?: string[]
  cloneCells?: string[]
}

interface FPuzzlesRectangle {
  cells: string[]
  baseC?: string
  outlineC?: string
  fontC?: string
  width?: number
  height?: number
  angle?: number
}

interface FPuzzlesOddEven {
  cell: string
}

interface FPuzzlesExtraRegion {
  cells: string[]
}

interface FPuzzlesArrow {
  lines?: string[][]
  cells?: string[]
}

interface FPuzzlesLittleKillerSum {
  cell: string
  cells?: string[]
  direction?: string
  value?: number | string
}

interface FPuzzlesQuadruple {
  cells: string[]
  values: (number | string)[]
}

interface FPuzzlesPalindrome {
  lines: string[][]
}

interface FPuzzlesBetweenLine {
  lines: string[][]
}

interface FPuzzlesDifferenceRatio {
  cells: string[]
  value: number | string
}

interface FPuzzlesXV {
  cells: string[]
  value: string
}

interface FPuzzlesSandwichSum {
  cell: string
  value: number | string
}

interface FPuzzlesCircle {
  cells: string[]
  baseC?: string
  outlineC?: string
  fontC?: string
  width: number
  height: number
  value?: number | string
}

interface FPuzzlesThermometer {
  lines: string[][]
}

interface FPuzzlesText {
  cells: string[]
  value?: string
  fontC?: string
  size?: number
  angle?: number
}

interface FPuzzlesData {
  size?: number
  grid: FPuzzlesCell[][]
  title?: string
  author?: string
  ruleset?: string
  cage?: FPuzzlesCage[]
  columnindexer: FPuzzlesColumnIndexer[]
  killercage?: FPuzzlesCage[]
  minimum?: FPuzzlesMinMax[]
  maximum?: FPuzzlesMinMax[]
  ["diagonal+"]: boolean
  ["diagonal-"]: boolean
  line?: FPuzzlesLine[]
  clone?: FPuzzlesClone[]
  rectangle?: FPuzzlesRectangle[]
  odd?: FPuzzlesOddEven[]
  even?: FPuzzlesOddEven[]
  extraregion?: FPuzzlesExtraRegion[]
  arrow?: FPuzzlesArrow[]
  littlekillersum?: FPuzzlesLittleKillerSum[]
  quadruple?: FPuzzlesQuadruple[]
  palindrome?: FPuzzlesPalindrome[]
  betweenline?: FPuzzlesBetweenLine[]
  difference?: FPuzzlesDifferenceRatio[]
  ratio?: FPuzzlesDifferenceRatio[]
  xv?: FPuzzlesXV[]
  sandwichsum?: FPuzzlesSandwichSum[]
  circle?: FPuzzlesCircle[]
  thermometer?: FPuzzlesThermometer[]
  text?: FPuzzlesText[]
  solution?: (number | string | undefined)[]
  fogofwar?: string[]
  foglight?: string[]
  metadata?: Metadata
}

interface CustomStyle {
  arrow: Arrow
  bulb: Line
}

const MIN_GRID_SIZE = 3
const MAX_GRID_SIZE = 16
const GRID_SIZES = [
  undefined,
  undefined,
  undefined,
  { width: 3, height: 1 },
  { width: 2, height: 2 },
  { width: 5, height: 1 },
  { width: 3, height: 2 },
  { width: 7, height: 1 },
  { width: 4, height: 2 },
  { width: 3, height: 3 },
  { width: 5, height: 2 },
  { width: 11, height: 1 },
  { width: 4, height: 3 },
  { width: 13, height: 1 },
  { width: 7, height: 2 },
  { width: 5, height: 3 },
  { width: 4, height: 4 }
]

function cellToCell(
  cell: string,
  offsetX = 0.5,
  offsetY = 0.5
): [number, number] {
  let m = cell.match(/R([0-9]+)C([0-9]+)/)!
  return [+m[1] - 1 + offsetX, +m[2] - 1 + offsetY]
}

function cellsToBoundingBox(cells: string[]): [number, number, number, number] {
  let minX = Number.MAX_VALUE
  let minY = Number.MAX_VALUE
  let maxX = 0
  let maxY = 0
  for (let c of cells) {
    let cc = cellToCell(c)
    if (cc[1] > maxX) {
      maxX = cc[1]
    }
    if (cc[1] < minX) {
      minX = cc[1]
    }
    if (cc[0] > maxY) {
      maxY = cc[0]
    }
    if (cc[0] < minY) {
      minY = cc[0]
    }
  }
  return [minX, minY, maxX, maxY]
}

function cellsToCenter(cells: string[]): [number, number] {
  let cc = cells.map(c => cellToCell(c))
  return [mean(cc.map(c => c[0])), mean(cc.map(c => c[1]))]
}

function fixLineConnector(l0: string, l1: string, wp: [number, number]) {
  let cl0 = cellToCell(l0, 0, 0)
  let cl1 = cellToCell(l1, 0, 0)
  let dx = cl1[0] - cl0[0]
  let dy = cl1[1] - cl0[1]
  if (dx !== 0 && dy !== 0) {
    wp[0] += 0.21 * dx
    wp[1] += 0.21 * dy
  } else if (dx === 0 && dy !== 0) {
    wp[1] += 0.31 * dy
  } else if (dy === 0 && dx !== 0) {
    wp[0] += 0.31 * dx
  }
}

function convertMinMax(
  m: FPuzzlesMinMax,
  isMax: boolean,
  arrows: Arrow[],
  underlays: Overlay[]
) {
  let center = cellToCell(m.cell)
  let newArrows: Arrow[] = []
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

function makeDefaultRegions(puzzle: FPuzzlesData): number[][] {
  let puzzleSize = puzzle.size ?? 9
  if (puzzleSize < MIN_GRID_SIZE) {
    puzzleSize = MIN_GRID_SIZE
  }
  if (puzzleSize > MAX_GRID_SIZE) {
    puzzleSize = MAX_GRID_SIZE
  }
  let { width, height } = GRID_SIZES[puzzleSize]!
  let regions: number[][] = []
  let box = 0
  for (let r = 0; r < width; ++r) {
    for (let c = 0; c < height; ++c) {
      for (let y = 0; y < width; ++y) {
        for (let x = 0; x < height; ++x) {
          regions[x + r * height] ||= []
          regions[x + r * height][y + c * width] = box
        }
      }
      box++
    }
  }
  return regions
}

export function convertFPuzzle(puzzle: FPuzzlesData): Data {
  let defaultRegions = makeDefaultRegions(puzzle)
  let regions: [number, number][][] = []
  let cells: DataCell[][] = puzzle.grid.map((row, y) =>
    row.map((col, x) => {
      let r =
        col.region === undefined || isNaN(col.region)
          ? defaultRegions[y][x]
          : col.region
      regions[r] ||= []
      regions[r].push([y, x])

      return {
        value: col.given ? col.value : undefined,
        centremarks: col.centerPencilMarks,
        cornermarks: col.cornerPencilMarks
      }
    })
  )

  // make sure all regions are initialized
  for (let i = 0; i < regions.length; ++i) {
    if (regions[i] === undefined) {
      regions[i] = []
    }
  }

  let fogLights: FogLight[] | undefined = undefined
  if (puzzle.fogofwar !== undefined) {
    fogLights = []
    for (let c of puzzle.fogofwar) {
      fogLights.push({
        center: cellToCell(c, 0, 0),
        size: 3
      })
    }
  }
  if (puzzle.foglight !== undefined) {
    for (let c of puzzle.foglight) {
      if (fogLights === undefined) {
        fogLights = []
      }
      fogLights.push({
        center: cellToCell(c, 0, 0),
        size: 1
      })
    }
  }

  let cages: Cage[] = []
  let killercages = [...(puzzle.killercage ?? []), ...(puzzle.cage ?? [])]
  let customStyle: CustomStyle | undefined = undefined
  for (let cage of killercages) {
    if (
      isString(cage.value) &&
      (cage.value.toLowerCase() === "fow" ||
        cage.value.toLowerCase() === "foglight")
    ) {
      if (fogLights === undefined) {
        fogLights = []
      }
      for (let c of cage.cells) {
        fogLights.push({
          center: cellToCell(c, 0, 0),
          size: cage.value.toLowerCase() === "fow" ? 3 : 1
        })
      }
    } else if (
      isString(cage.value) &&
      cage.value.toLowerCase().startsWith("customstyle:")
    ) {
      customStyle = JSON.parse(cage.value.substring(12).trim())
    } else if (
      isString(cage.value) &&
      cage.value.toLowerCase().startsWith("msgcorrect:")
    ) {
      // Message to be displayed if solution is correct. This is not
      // implemented yet. Ignore it.
    } else {
      let r: Cage = {
        cells: cage.cells.map(c => cellToCell(c, 0, 0)),
        value: cage.value
      }
      if (cage.outlineC) {
        r.borderColor = cage.outlineC
      }
      cages.push(r)
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

  let lines: Line[] = []

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
          color: l.outlineC ?? "#000000",
          thickness: (l.width ?? 0.05) * 20
        })
      }
    }
  }

  let underlays: Overlay[] = []

  // clones
  if (puzzle.clone !== undefined && puzzle.clone !== null) {
    for (let cl of puzzle.clone) {
      let cells = cl.cells ?? []
      let cloneCells = cl.cloneCells ?? []
      for (let c of [...cells, ...cloneCells]) {
        underlays.push({
          center: cellToCell(c),
          width: 1,
          height: 1,
          backgroundColor: "#CFCFCF",
          rounded: false
        })
      }
    }
  }

  // coloured cells
  for (let r = 0; r < puzzle.grid.length; ++r) {
    let row = puzzle.grid[r]
    for (let c = 0; c < row.length; ++c) {
      if (row[c].c !== undefined && row[c].c !== null) {
        underlays.push({
          center: [r + 0.5, c + 0.5],
          width: 1,
          height: 1,
          backgroundColor: row[c].c
        })
      }
    }
  }

  // 1-5-9 cells
  if (Array.isArray(puzzle.columnindexer)) {
    for (let ci of puzzle.columnindexer) {
      let cells = ci.cells ?? []
      for (let c of cells) {
        underlays.push({
          center: cellToCell(c),
          width: 1,
          height: 1,
          backgroundColor: "#E6261F"
        })
      }
    }
  }

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

  // extra regions
  let extraRegions: ExtraRegion[] | undefined = undefined
  if (puzzle.extraregion !== undefined && puzzle.extraregion !== null) {
    extraRegions = []
    for (let e of puzzle.extraregion) {
      extraRegions.push({
        cells: e.cells.map(c => cellToCell(c, 0, 0)),
        backgroundColor: "#CFCFCF"
      })
    }
  }

  let arrows: Arrow[] = []

  if (puzzle.arrow !== undefined && puzzle.arrow !== null) {
    for (let a of puzzle.arrow) {
      if (a.cells !== undefined && a.cells !== null) {
        let [minX, minY, maxX, maxY] = cellsToBoundingBox(a.cells)
        let width = maxX - minX
        let height = maxY - minY

        underlays.push({
          center: cellsToCenter(a.cells),
          width: width + 0.7,
          height: height + 0.7,
          borderColor: customStyle?.bulb?.color ?? "#CFCFCF",
          backgroundColor: "#FFFFFF",
          rounded: true,
          thickness: customStyle?.bulb?.thickness
        })
      }
      if (a.lines !== undefined && a.lines !== null) {
        for (let l of a.lines) {
          let newArrow: Arrow = {
            wayPoints: l.map(c => cellToCell(c)),
            color: customStyle?.arrow?.color ?? "#CFCFCF",
            thickness: customStyle?.arrow?.thickness ?? 2,
            headLength: customStyle?.arrow?.headLength ?? 0.3
          }
          if (
            a.cells !== undefined &&
            a.cells !== null &&
            l.length > 1 &&
            a.cells.includes(l[0])
          ) {
            fixLineConnector(l[0], l[1], newArrow.wayPoints[0])
          }
          arrows.push(newArrow)
        }
      }
    }
  }

  let overlays: Overlay[] = []

  if (puzzle.rectangle !== undefined && puzzle.rectangle !== null) {
    for (let r of puzzle.rectangle) {
      let [minX, minY, maxX, maxY] = cellsToBoundingBox(r.cells)
      let width = 1 + (maxX - minX)
      let height = 1 + (maxY - minY)
      let rotation
      if (r.angle !== undefined) {
        rotation = (r.angle * (2 * Math.PI)) / 360
      }
      overlays.push({
        center: cellsToCenter(r.cells),
        width: r.width ?? 0.5 * width,
        height: r.height ?? 0.5 * height,
        borderColor: r.outlineC ?? "#000000",
        backgroundColor: r.baseC ?? "#FFFFFF",
        rounded: false,
        rotation
      })
    }
  }

  if (puzzle.littlekillersum !== undefined && puzzle.littlekillersum !== null) {
    for (let l of puzzle.littlekillersum) {
      let center = cellToCell(l.cell)
      let arrow: Arrow | undefined = undefined
      if (l.direction === "UR") {
        arrow = {
          wayPoints: [
            [center[0] - 0.05, center[1] + 0.05],
            [center[0] - 0.5, center[1] + 0.5]
          ],
          color: "#CFCFCF",
          thickness: 5,
          headLength: 0.3
        }
      } else if (l.direction === "DR") {
        arrow = {
          wayPoints: [
            [center[0] + 0.05, center[1] + 0.05],
            [center[0] + 0.5, center[1] + 0.5]
          ],
          color: "#CFCFCF",
          thickness: 5,
          headLength: 0.3
        }
      } else if (l.direction === "UL") {
        arrow = {
          wayPoints: [
            [center[0] - 0.05, center[1] - 0.05],
            [center[0] - 0.5, center[1] - 0.5]
          ],
          color: "#CFCFCF",
          thickness: 5,
          headLength: 0.3
        }
      } else if (l.direction === "DL") {
        arrow = {
          wayPoints: [
            [center[0] + 0.05, center[1] - 0.05],
            [center[0] + 0.5, center[1] - 0.5]
          ],
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
      if (arrow !== undefined) {
        arrows.push(arrow)
      }
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
          fixLineConnector(
            l[l.length - 1],
            l[l.length - 2],
            newLine.wayPoints[l.length - 1]
          )

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
      let center = cellsToCenter(r.cells)
      overlays.push({
        center,
        width: 0.3,
        height: 0.3,
        borderColor: "#000000",
        backgroundColor: "#FFFFFF",
        rounded: true,
        fontSize: 10,
        text: r.value
      })
    }
  }

  if (puzzle.ratio !== undefined && puzzle.ratio !== null) {
    for (let r of puzzle.ratio) {
      let center = cellsToCenter(r.cells)
      overlays.push({
        center,
        width: 0.3,
        height: 0.3,
        borderColor: "#000000",
        backgroundColor: "#000000",
        rounded: true,
        fontSize: 10,
        fontColor: "#FFFFFF",
        text: r.value
      })
    }
  }

  if (puzzle.xv !== undefined && puzzle.xv !== null) {
    for (let xv of puzzle.xv) {
      let center = cellsToCenter(xv.cells)
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
      let center = cellsToCenter(circ.cells)
      let ou = overlays
      if ((circ.width > 1 || circ.height > 1) && circ.baseC !== undefined) {
        // Circle will most likely cover other elements (e.g. the grid).
        // Put it into 'underlays' instead of 'overlays'. Alternatively, if
        // this causes other issues in the future, we could make the
        // circle's background color slightly transparent.
        ou = underlays
      }
      let fontSize = 20
      if (circ.value !== undefined) {
        let lines = `${circ.value}`.split("\n")
        if (lines.length > 1) {
          fontSize = 10
        }
        for (let l of lines) {
          if (l.length > 2) {
            fontSize = 10
          }
        }
      }
      ou.push({
        center,
        width: circ.width,
        height: circ.height,
        borderColor: circ.outlineC,
        backgroundColor: circ.baseC,
        rounded: true,
        fontSize: fontSize,
        text: circ.value
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

  if (puzzle.text !== undefined && puzzle.text !== null) {
    for (let t of puzzle.text) {
      let center = cellsToCenter(t.cells)
      let rotation
      if (t.angle !== undefined) {
        rotation = (t.angle * (2 * Math.PI)) / 360
      }
      overlays.push({
        center,
        width: 1,
        height: 1,
        fontSize: 28 * (t.size ?? 1),
        fontColor: t.fontC,
        text: t.value,
        rotation
      })
    }
  }

  let solution: (number | undefined)[][] | undefined = undefined
  if (puzzle.solution !== undefined) {
    let i = 0
    solution = []
    cells.forEach(row => {
      let srow: (number | undefined)[] = []
      solution!.push(srow)
      row.forEach(() => {
        let v = puzzle.solution![i++]
        let n: number | undefined
        if (v !== undefined && isString(v)) {
          n = +v
          if (isNaN(n)) {
            n = undefined
          }
        } else {
          n = v
        }
        if (n === 0) {
          n = undefined
        }
        srow.push(n)
      })
    })
  }

  let result: Data = {
    cellSize: 50,
    cells,
    regions,
    cages,
    lines,
    extraRegions,
    overlays,
    underlays,
    arrows,
    solution,
    fogLights,
    metadata: puzzle.metadata,
    solved: false
  }

  return result
}
