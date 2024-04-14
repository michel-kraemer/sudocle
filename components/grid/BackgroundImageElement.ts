import { GridElement } from "./GridElement"
import { Assets, Container, Graphics, Sprite } from "pixi.js"

class BackgroundImageElement implements GridElement {
  private sprite?: Sprite
  private cellSize: number = 0
  private width: number = 0
  private height: number = 0
  private readonly columns: number
  private readonly rows: number
  readonly container: Container
  private readonly mask: Graphics

  constructor(url: string, alpha: number, columns: number, rows: number) {
    this.container = new Container()
    this.columns = columns
    this.rows = rows

    this.mask = new Graphics()
    this.container.mask = this.mask

    Assets.load(url).then(asset => {
      if (!this.container.destroyed) {
        this.sprite = new Sprite(asset)
        this.sprite.alpha = alpha
        this.sprite.x = -this.cellSize / 4
        this.sprite.y = -this.cellSize / 4
        this.sprite.width = this.width + this.cellSize / 2
        this.sprite.height = this.height + this.cellSize / 2
        this.container.addChild(this.sprite)
      }
    })
  }

  clear() {
    this.mask.clear()
  }

  draw(options: { cellSize: number }): void {
    this.container.x = 0
    this.container.y = 0

    this.cellSize = options.cellSize
    this.width = options.cellSize * this.columns
    this.height = options.cellSize * this.rows

    this.mask.rect(0, 0, this.width, this.height)
    this.mask.fill(0x0)

    if (this.sprite !== undefined) {
      this.sprite.x = -options.cellSize / 4
      this.sprite.y = -options.cellSize / 4
      this.sprite.width = this.width + options.cellSize / 2
      this.sprite.height = this.height + options.cellSize / 2
    }
  }
}

export default BackgroundImageElement
