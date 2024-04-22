import { DataCell } from "../types/Data"
import { isString } from "lodash"

function parseSolution(
  cells: DataCell[][],
  str: string,
): (number | undefined)[][] {
  let solution: (number | undefined)[][] = []
  let i = 0
  for (let row of cells) {
    let srow: (number | undefined)[] = []
    solution!.push(srow)
    for (let _ of row) {
      let v = str[i++]
      let n: number | undefined
      if (v !== undefined && isString(v)) {
        n = +v
        if (isNaN(n)) {
          n = undefined
        }
      } else {
        n = v
      }
      srow.push(n)
    }
  }
  return solution
}

export default parseSolution
