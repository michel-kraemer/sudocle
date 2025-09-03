import { unionCells } from "../lib/utils"
import { DataCell } from "../types/Data"
import { DrawOptionField, GridElement } from "./GridElement"
import { DropShadowFilter } from "pixi-filters/drop-shadow"
import { Container, Graphics } from "pixi.js"

class FogElement implements GridElement {
  readonly container: Container
  private readonly graphics: Graphics
  private readonly mask: Graphics
  private readonly cells: DataCell[][]

  constructor(cells: DataCell[][], enableDropShadow: boolean) {
    this.container = new Container()
    this.graphics = new Graphics()
    this.mask = new Graphics()
    this.container.addChild(this.graphics)
    this.container.addChild(this.mask)

    this.cells = cells

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

    this.graphics.mask = this.mask
  }

  clear() {
    this.graphics.clear()
    this.mask.clear()
  }

  drawOptionsToMemoize(): DrawOptionField[] {
    return [DrawOptionField.CellSize, DrawOptionField.CurrentFogRaster]
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

    // draw mask that is just as large as the grid
    let maskWidth = this.cells[0].length * options.cellSize
    let maskHeight = this.cells.length * options.cellSize
    this.mask.rect(0, 0, maskWidth, maskHeight)
    this.mask.fill(0)

    // draw fog
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
