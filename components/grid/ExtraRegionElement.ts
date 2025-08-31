import { getRGBColor } from "../lib/colorutils"
import { disposePolygon, shrinkPolygon } from "../lib/polygonutils"
import { DrawOptionField, GridElement } from "./GridElement"
import { Graphics } from "pixi.js"

export interface GridExtraRegion {
  outline: number[]
  backgroundColor: string
}

class ExtraRegionElement implements GridElement {
  private readonly extraRegion: GridExtraRegion
  private readonly regions: number[][]
  readonly graphics: Graphics

  constructor(extraRegion: GridExtraRegion, regions: number[][]) {
    this.extraRegion = extraRegion
    this.regions = regions
    this.graphics = new Graphics()
  }

  clear() {
    this.graphics.clear()
  }

  drawOptionsToMemoize(): DrawOptionField[] {
    return [DrawOptionField.CellSize]
  }

  draw(options: { cellSize: number }) {
    let disposedOutline = disposePolygon(
      this.extraRegion.outline.map(v => v * options.cellSize),
      this.regions.map(rarr => rarr.map(v => v * options.cellSize)),
      1,
    )
    let shrunkenOutline = shrinkPolygon(disposedOutline, 3)
    this.graphics.poly(shrunkenOutline)
    this.graphics.fill(getRGBColor(this.extraRegion.backgroundColor))
  }
}

export default ExtraRegionElement
