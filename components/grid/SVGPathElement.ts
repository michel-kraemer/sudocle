import { SVGPath } from "../types/Data"
import { GridElement } from "./GridElement"
import { Assets, Container, Graphics, Sprite } from "pixi.js"

// This is rather complex, but PIXI's Graphics.svg() does not support all SVG
// features (e.g. `fill-rule`)
class SVGPathElement implements GridElement {
  private unitSize: number
  private factor: number
  private bbox: DOMRect
  private sprite?: Sprite
  private placeholder?: Graphics
  readonly container: Container
  readonly readyPromise: Promise<void>

  constructor(path: SVGPath) {
    this.container = new Container()
    this.unitSize = 1

    let defaultCellSize = 50
    this.factor = defaultCellSize / path.cellSize

    this.placeholder = new Graphics()
    this.container.addChild(this.placeholder)

    // convert path to SVG node
    let ns = "http://www.w3.org/2000/svg"
    let svg = document.createElementNS(ns, "svg")
    let p = document.createElementNS(ns, "path") as SVGGraphicsElement
    p.setAttribute("d", path.d)
    if (path.fill !== undefined) {
      p.setAttribute("fill", path.fill)
    }
    if (path.fillRule !== undefined) {
      p.setAttribute("fill-rule", path.fillRule)
    }
    svg.appendChild(p)

    // calculate bounding box (we need to temporarily add the SVG node to the DOM)
    svg.setAttribute(
      "style",
      "width: 0; height: 0; position: absolute; top: 0; left: 0; " +
        "overflow: hidden; visibility: hidden; opacity: 0",
    )
    document.body.append(svg)
    this.bbox = p.getBBox()
    svg.remove()
    svg.removeAttribute("style")

    // set SVG viewBox according to the calculated bounding box
    svg.setAttribute(
      "viewBox",
      `${this.bbox.x} ${this.bbox.y} ${this.bbox.width} ${this.bbox.height}`,
    )

    // increase precision
    svg.setAttribute("width", `${this.bbox.width * 2}`)
    svg.setAttribute("height", `${this.bbox.height * 2}`)

    // convert SVG to image
    let xml = new XMLSerializer().serializeToString(svg)
    let b = "data:image/svg+xml;base64," + Buffer.from(xml).toString("base64")

    // convert image to sprite and add it to scene graph
    this.readyPromise = Assets.load(b).then(asset => {
      if (!this.container.destroyed) {
        this.sprite = new Sprite(asset)
        this.sprite.x = this.bbox.x * this.unitSize * this.factor
        this.sprite.y = this.bbox.y * this.unitSize * this.factor
        this.sprite.width = this.bbox.width * this.unitSize * this.factor
        this.sprite.height = this.bbox.height * this.unitSize * this.factor
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
    this.placeholder?.clear()
  }

  draw(options: { unitSize: number }) {
    this.unitSize = options.unitSize

    let x = this.bbox.x * this.unitSize * this.factor
    let y = this.bbox.y * this.unitSize * this.factor
    let width = this.bbox.width * this.unitSize * this.factor
    let height = this.bbox.height * this.unitSize * this.factor

    if (this.placeholder !== undefined) {
      this.placeholder.rect(x, y, width, height)
      this.placeholder.fill({ color: 0, alpha: 0 })
    }

    if (this.sprite !== undefined) {
      this.sprite.x = x
      this.sprite.y = y
      this.sprite.width = width
      this.sprite.height = height
    }
  }
}

export default SVGPathElement
