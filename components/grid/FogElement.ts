import { unionCells } from "../lib/utils"
import { GridElement } from "./GridElement"
import { DropShadowFilter } from "pixi-filters/drop-shadow"
import { Graphics } from "pixi.js"

class FogElement implements GridElement {
  readonly graphics: Graphics

  constructor(enableDropShadow: boolean) {
    this.graphics = new Graphics()

    if (enableDropShadow) {
      let dropShadow = new DropShadowFilter({
        offset: { x: 0, y: 0 },
        blur: 5,
        quality: 6,
        alpha: 0.9,
        color: 0x272e31,
      })
      dropShadow.padding = 20
      this.graphics.filters = [dropShadow]
    }
  }

  clear(): void {
    this.graphics.clear()
  }

  draw(options: {
    cellSize: number
    currentFogRaster: number[][] | undefined
  }) {
    if (options.currentFogRaster === undefined) {
      return
    }

    let flatCells: [number, number][] = []
    options.currentFogRaster.forEach((row, y) => {
      row.forEach((v, x) => {
        if (v === 1) {
          flatCells.push([y, x])
        }
      })
    })

    let polygons = unionCells(flatCells)
    for (let polygon of polygons) {
      let poly = polygon.map(o => o.map(r => r * options.cellSize))
      this.graphics.poly(poly[0])
      this.graphics.fill(0x8b909b)
      if (poly.length > 1) {
        for (let i = 1; i < poly.length; ++i) {
          this.graphics.poly(poly[i])
        }
        this.graphics.cut()
      }
    }
  }
}

export default FogElement
