import {
  Arrow,
  Cage,
  Data,
  DataCell,
  ExtraRegion,
  FogLight,
  Line,
  Overlay
} from "../types/Data"
import JSON5 from "json5"
import rename from "deep-rename-keys"

const KEYS: Record<string, string> = {
  c: "color",
  ca: "cages",
  ct: "center",
  c1: "borderColor",
  c2: "backgroundColor",
  ce: "cells",
  cs: "cellSize",
  a: "arrows",
  o: "overlays",
  u: "underlays",
  w: "width",
  h: "height",
  v: "value",
  l: "lines",
  r: "rounded",
  re: "regions",
  fs: "fontSize",
  th: "thickness",
  hl: "headLength",
  wp: "wayPoints",
  te: "text"
}

function convertNewPuzzle(data: string): any {
  /* eslint-disable quotes */
  data = data
    .replace(/,(?=[,\]])/g, ",{}")
    .replace(/\[,/g, "[{},")
    .replace(/:t(?=[,}\]])/g, ":true")
    .replace(/:f(?=[,}\]])/g, ":false")
    .replace(/:#F(?=[,}\]])/g, ':"#FFFFFF"')
    .replace(/:#0(?=[,}\]])/g, ':"#000000"')
    .replace(/:([a-fA-F0-9]{6})(?=[,}\]])/g, ':"#$1"')
  /* eslint-enable quotes */

  let o = JSON5.parse(data)
  o = rename(o, k => {
    if (KEYS[k] !== undefined) {
      return KEYS[k]
    }
    return k
  })

  return o
}

export function convertCTCPuzzle(strPuzzle: string): Data {
  let puzzle = convertNewPuzzle(strPuzzle)

  let cells: DataCell[][] = puzzle.cells
  let regions: [number, number][][] = []

  let cages: Cage[] = puzzle.cages.filter(
    (c: any) => c.hidden === undefined || c.hidden === false
  )

  let lines: Line[] = puzzle.lines

  let extraRegions: ExtraRegion[] | undefined = undefined

  let overlays: Overlay[] = puzzle.overlays

  let underlays: Overlay[] = puzzle.underlays

  let arrows: Arrow[] = []

  let solution: (number | undefined)[][] | undefined = undefined

  let fogLights: FogLight[] | undefined = undefined

  let metadata = puzzle.metadata

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
    metadata,
    solved: false
  }

  return result
}
