import { CellExtent } from "./CellExtent"
import { GridElement } from "./GridElement"
import { Assets, Container, Graphics, Rectangle, Sprite } from "pixi.js"

class BackgroundImageElement implements GridElement {
  private sprite?: Sprite
  private cellSize: number = 0
  private width: number = 0
  private height: number = 0
  private readonly extent: CellExtent
  private placeholder?: Graphics
  readonly container: Container
  readonly readyPromise: Promise<void>

  constructor(url: string, alpha: number, extent: CellExtent) {
    this.container = new Container()
    this.extent = extent

    this.placeholder = new Graphics()
    this.container.addChild(this.placeholder)

    this.readyPromise = Assets.load(url).then(asset => {
      if (!this.container.destroyed) {
        this.sprite = new Sprite(asset)
        this.sprite.alpha = alpha
        this.sprite.x = 0
        this.sprite.y = 0
        this.sprite.width = this.width
        this.sprite.height = this.height
        if (this.placeholder !== undefined) {
          this.container.removeChild(this.placeholder)
          this.placeholder.destroy()
          this.placeholder = undefined
        }
        this.container.addChild(this.sprite)
      }
    })
  }

  clear() {
    if (this.placeholder !== undefined) {
      this.placeholder.clear()
    }
  }

  draw(options: { cellSize: number }): void {
    this.cellSize = options.cellSize

    this.container.x = this.extent.minX * this.cellSize - this.cellSize / 4
    this.container.y = this.extent.minY * this.cellSize - this.cellSize / 4

    let cols = this.extent.maxX - this.extent.minX
    let rows = this.extent.maxY - this.extent.minY
    this.width = this.cellSize * cols + this.cellSize / 2
    this.height = this.cellSize * rows + this.cellSize / 2

    if (this.placeholder !== undefined) {
      this.placeholder.rect(0, 0, this.width, this.height)
      this.placeholder.fill({ color: 0, alpha: 0 })
    }

    if (this.sprite !== undefined) {
      this.sprite.x = 0
      this.sprite.y = 0
      this.sprite.width = this.width
      this.sprite.height = this.height
    }
  }
}

export default BackgroundImageElement
