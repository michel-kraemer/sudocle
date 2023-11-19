import styles from "./Palette.oscss"
import { Minus, Plus } from "lucide-react"
import Color from "color"
import { FormEvent } from "react"

interface PaletteProps {
  colours: string[]
  customisable?: boolean
  updatePalette?: (colours: string[]) => void
}

const Palette = ({
  colours,
  customisable = false,
  updatePalette
}: PaletteProps) => {
  let gridTemplateColumns = `repeat(${colours.length}, 1fr)`
  if (customisable) {
    // add space for customise buttons
    gridTemplateColumns += " 2fr"
  }

  function onRemoveColour() {
    if (updatePalette === undefined) {
      return
    }
    let newColours = colours.slice(0, colours.length - 1)
    updatePalette(newColours)
  }

  function onAddColour() {
    if (updatePalette === undefined) {
      return
    }
    let newColours = [
      ...colours,
      Color({
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
      }).hex()
    ]
    updatePalette(newColours)
  }

  function onChangeColour(i: number, e: FormEvent<HTMLInputElement>) {
    if (updatePalette === undefined) {
      return
    }
    let newColours = [...colours]
    newColours[i] = e.currentTarget.value
    updatePalette(newColours)
  }

  return (
    <div className="palette" style={{ gridTemplateColumns }}>
      {colours.map((c, i) => {
        if (customisable) {
          return (
            <label
              key={i}
              className="colour customisable"
              style={{ backgroundColor: c }}
            >
              <input
                type="color"
                className="colour"
                defaultValue={Color(c.trim()).hex()}
                onInput={e => onChangeColour(i, e)}
              />
            </label>
          )
        } else {
          return (
            <div
              key={i}
              className="colour"
              style={{ backgroundColor: c }}
            ></div>
          )
        }
      })}
      {customisable && (
        <div className="customise-buttons">
          {colours.length < 12 && (
            <div
              className="add-button"
              title="Add colour"
              onClick={onAddColour}
            >
              <Plus size="1em" />
            </div>
          )}
          {colours.length > 1 && (
            <div
              className="remove-button"
              title="Remove last colour"
              onClick={onRemoveColour}
            >
              <Minus size="1em" />
            </div>
          )}
        </div>
      )}
      <style jsx>{styles}</style>
    </div>
  )
}

export default Palette
