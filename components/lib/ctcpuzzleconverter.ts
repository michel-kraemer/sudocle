import {
  Arrow,
  Cage,
  Data,
  DataCell,
  ExtraRegion,
  FogLight,
  Overlay,
  Settings,
  TriggerEffect,
  TriggerEffectType,
  TriggerType,
} from "../types/Data"
import parseSolution from "./parsesolution"
import { parseCells } from "./utils"
import Color from "color"
import rename from "deep-rename-keys"
import JSON5 from "json5"
import { isArray, isString } from "lodash"

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
  t: "title",
  te: "text",
  d: "duration",
  d2: "d",
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

  let defaultCellSize = 50
  let puzzleCellSize = puzzle.cellSize ?? defaultCellSize

  let cells: DataCell[][] = puzzle.cells
  let regions: [number, number][][] = puzzle.regions

  let cages: Cage[] = (puzzle.cages || []).filter(
    (c: any) =>
      (c.hidden === undefined || c.hidden === false) && c.style !== "hidden",
  )

  cages = cages.map((c: any) => {
    let r = { ...c }

    // map outlineC to borderColor
    if (r.outlineC !== undefined) {
      r.borderColor = r.outlineC
      delete r.outlineC
    }

    // parse cageValue
    if (r.cageValue) {
      let m = r.cageValue.match(/r-?[0-9]+c-?[0-9]+=([0-9]+)/i)
      if (m) {
        r.value = m[1]
      } else {
        r.value = r.cageValue
      }
      delete r.cageValue
    }

    return r
  })

  let lines = []
  let svgPaths = []

  if (puzzle.lines !== undefined) {
    for (let l of puzzle.lines) {
      let r = { ...l }

      if ("wayPoints" in r) {
        if (r.fill !== undefined) {
          r.backgroundColor = r.fill
          delete r.fill
        }

        if (isString(r["stroke-dasharray"])) {
          let arr = r["stroke-dasharray"].split(/\s+|,/)
          r.strokeDashArray = arr.map(
            v => (+v * defaultCellSize) / puzzleCellSize,
          )
          delete r["stroke-dasharray"]
        }

        if (r["stroke-dashoffset"] !== undefined) {
          r.strokeDashOffset =
            (+r["stroke-dashoffset"] * defaultCellSize) / puzzleCellSize
          delete r["stroke-dashoffset"]
        }

        lines.push(r)
      } else if ("d" in r) {
        r.cellSize = puzzleCellSize

        if (r["fill-rule"] !== undefined) {
          r.fillRule = r["fill-rule"]
          delete r["fill-rule"]
        }

        svgPaths.push(r)
      }
    }
  }

  let extraRegions: ExtraRegion[] | undefined = undefined

  let overlays: Overlay[] = []

  // add underlays with target `overlay` to `overlays` (they should appear
  // before the actual overlays)
  if (puzzle.underlays !== undefined) {
    overlays.push(
      ...puzzle.underlays
        .filter((u: any) => u.target === "overlay")
        .map(mapOverlay),
    )
  }

  // add actual overlays
  if (puzzle.overlays !== undefined) {
    overlays.push(...puzzle.overlays.map(mapOverlay))
  }

  let underlays: Overlay[] = puzzle.underlays
    ?.filter((u: any) => u.target !== "overlay")
    .map((o: any) => {
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
  if (
    puzzle.foglight !== undefined &&
    isArray(puzzle.foglight) &&
    puzzle.foglight.length > 0
  ) {
    fogLights = []
    for (let l of puzzle.foglight) {
      if (isString(l)) {
        fogLights.push({
          center: parseCells(l)[0],
          size: 1,
        })
      } else {
        fogLights.push({
          center: l,
          size: 1,
        })
      }
    }
  }

  let solution: (number | undefined)[][] | undefined = undefined
  if (isString(puzzle.metadata?.solution)) {
    solution = parseSolution(cells, puzzle.metadata.solution)
    delete puzzle.metadata.solution
  }

  let title: string | undefined
  if (isString(puzzle.metadata?.title)) {
    title = puzzle.metadata.title
    delete puzzle.metadata.title
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

  let settings: Settings = {
    nogrid: false,
  }
  if (puzzle.settings?.nogrid) {
    settings.nogrid = true
  }

  let triggerEffects: TriggerEffect[] | undefined = undefined
  if (puzzle.triggereffect !== undefined) {
    if (isArray(puzzle.triggereffect)) {
      for (let te of puzzle.triggereffect) {
        let effect:
          | { type: TriggerEffectType; cells: [number, number][] }
          | undefined
        if (
          te.effect !== undefined &&
          te.effect.type === "foglight" &&
          isString(te.effect.cells)
        ) {
          effect = { type: "foglight", cells: parseCells(te.effect.cells) }
        }

        let trigger: { type: TriggerType; cell: [number, number] } | undefined
        if (
          te.trigger !== undefined &&
          te.trigger.type === "cellvalue" &&
          isString(te.trigger.cell)
        ) {
          trigger = { type: "cellvalue", cell: parseCells(te.trigger.cell)[0] }
        }

        if (effect !== undefined && trigger !== undefined) {
          if (triggerEffects === undefined) {
            triggerEffects = []
          }
          triggerEffects.push({ effect, trigger })
        }
      }
    }
  }

  let result: Data = {
    cellSize: defaultCellSize,
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
    svgPaths,
    title,
    author,
    rules,
    metadata,
    settings,
    triggerEffects,
    solved: false,
  }

  return result
}
