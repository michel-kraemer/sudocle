import {
  Arrow,
  Cage,
  Data,
  DataCell,
  ExtraRegion,
  FogLight,
  Line,
  Overlay,
} from "../types/Data"
import parseSolution from "./parsesolution"
import Color from "color"
import rename from "deep-rename-keys"
import JSON5 from "json5"
import { isString } from "lodash"

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
  te: "text",
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

function mapOverlay(o: any): Overlay {
  let r = { ...o }

  // map angle to rotation
  if (r.angle !== undefined) {
    r.rotation = (r.angle * (2 * Math.PI)) / 360
    delete r.angle
  }

  if (r["dominant-baseline"] !== undefined) {
    // empirically determined values for size and center to make font look right
    if (r.fontSize !== undefined) {
      r.fontSize = r.fontSize * 0.85
    }
    // TODO do not move all overlays, instead move just the text!!!
    r.center = [r.center[0] - (r.fontSize ?? 0) / 125, r.center[1]]
  }

  // map color to fontColor
  if (r.color !== undefined) {
    r.fontColor = r.color
    delete r.color
  }

  if (
    r.text !== undefined &&
    r.text !== "" &&
    r.fontSize === undefined &&
    r.height < 0.5
  ) {
    r.fontSize = Math.max(10, 50 * r.height)
  }

  return r
}

export function convertCTCPuzzle(strPuzzle: string): Data {
  let puzzle = convertNewPuzzle(strPuzzle)

  let cells: DataCell[][] = puzzle.cells
  let regions: [number, number][][] = puzzle.regions

  let cages: Cage[] = (puzzle.cages || []).filter(
    (c: any) => c.hidden === undefined || c.hidden === false,
  )

  // map outlineC to borderColor
  cages = cages.map((c: any) => {
    let r = { ...c }
    if (r.outlineC !== undefined) {
      r.borderColor = r.outlineC
      delete r.outlineC
    }
    return r
  })

  let lines: Line[] = puzzle.lines?.map((l: any) => {
    let r = { ...l }
    if (r.fill !== undefined) {
      r.backgroundColor = r.fill
      delete r.fill
    }
    return r
  })

  let extraRegions: ExtraRegion[] | undefined = undefined

  let overlays: Overlay[] = puzzle.overlays?.map(mapOverlay)

  let underlays: Overlay[] = puzzle.underlays?.map((o: any) => {
    let r = mapOverlay(o)

    // In OverlayElement.ts, we apply an opacity of 0.5 if the colour is not
    // grey (see OverlayElement.draw()). But for this kind of puzzle, we need
    // to always apply an opacity of 0.5, regardless of the colour.
    if (r.backgroundColor !== undefined) {
      let bc = Color(r.backgroundColor.trim())
      let alpha = bc.alpha()
      if (alpha === 1) {
        r.backgroundColor = bc.alpha(0.5).toString()
      }
    }

    return r
  })

  let arrows: Arrow[] = puzzle.arrows

  let fogLights: FogLight[] | undefined = undefined

  let solution: (number | undefined)[][] | undefined = undefined
  if (isString(puzzle.metadata?.solution)) {
    solution = parseSolution(cells, puzzle.metadata.solution)
    delete puzzle.metadata.solution
  }

  let title: string | undefined
  if (isString(puzzle.metadata?.title)) {
    title = puzzle.metadata.title
    delete puzzle.metadata.title
  } else if (isString(puzzle.metadata?.t)) {
    title = puzzle.metadata.t
    delete puzzle.metadata.t
  }

  let rules: string | undefined
  if (isString(puzzle.metadata?.rules)) {
    rules = puzzle.metadata.rules
    delete puzzle.metadata.rules
  }

  let author: string | undefined
  if (isString(puzzle.metadata?.author)) {
    author = puzzle.metadata.author
    delete puzzle.metadata.author
  }

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
    title,
    author,
    rules,
    metadata,
    solved: false,
  }

  return result
}
