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
import Color from "color"

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
  let regions: [number, number][][] = puzzle.regions

  let cages: Cage[] = puzzle.cages.filter(
    (c: any) => c.hidden === undefined || c.hidden === false
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

  let lines: Line[] = puzzle.lines

  let extraRegions: ExtraRegion[] | undefined = undefined

  let overlays: Overlay[] = puzzle.overlays?.map((o: any) => {
    // empirically determined values for size and center to make font look right
    let r = { ...o }
    if (r["dominant-baseline"] !== undefined) {
      if (r.fontSize !== undefined) {
        r.fontSize = r.fontSize * 0.85
      }
      // TODO do not move all overlays, instead move just the text!!!
      r.center = [r.center[0] - (r.fontSize ?? 0) / 125, r.center[1]]
    }
    return r
  })

  let underlays: Overlay[] = puzzle.underlays?.map((o: any) => {
    // map angle to rotation
    let r = { ...o }
    if (r.angle !== undefined) {
      r.rotation = (r.angle * (2 * Math.PI)) / 360
      delete r.angle
    }

    // map color to fontColor
    if (r.color !== undefined) {
      r.fontColor = r.color
      delete r.color
    }

    // In Grid.tsx, we apply an opacity of 0.5 if the colour is not grey (see
    // drawOverlay()). But for this kind of puzzle, we need to always apply an
    // opacity of 0.5, regardless of the colour.
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
