import Color from "color"
import { Minus, Plus } from "lucide-react"
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
    <div
      className="grid gap-x-[0.3em] ml-[0.05em] mt-[0.25em] mb-[0.5em]"
      style={{ gridTemplateColumns }}
    >
      {colours.map((c, i) => {
        if (customisable) {
          return (
            <label
              key={i}
              className="w-[1em] h-[1em] shadow-[0_0_1px_rgba(0_0_0/20%)] cursor-pointer"
              style={{ backgroundColor: c }}
            >
              <input
                type="color"
                className="invisible"
                defaultValue={Color(c.trim()).hex()}
                onInput={e => onChangeColour(i, e)}
              />
            </label>
          )
        } else {
          return (
            <div
              key={i}
              className="w-[1em] h-[1em] shadow-[0_0_1px_rgba(0_0_0/20%)]"
              style={{ backgroundColor: c }}
            ></div>
          )
        }
      })}
      {customisable && (
        <div className="flex">
          {colours.length < 12 && (
            <div
              className="flex h-[1em] w-[1em] cursor-pointer"
              title="Add colour"
              onClick={onAddColour}
            >
              <Plus size="1em" />
            </div>
          )}
          {colours.length > 1 && (
            <div
              className="flex h-[1em] w-[1em] cursor-pointer"
              title="Remove last colour"
              onClick={onRemoveColour}
            >
              <Minus size="1em" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Palette
