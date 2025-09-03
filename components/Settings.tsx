import Palette from "./Palette"
import RadioGroup from "./RadioGroup"
import RangeSlider from "./RangeSlider"
import { PEN_MAX_WIDTH } from "./grid/PenElement"
import { useSettings } from "./hooks/useSettings"
import { useEffect, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"

const PaletteLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-start">{children}</div>
)

const Settings = () => {
  const {
    colourPalette,
    theme,
    customColours,
    zoom,
    fontSizeFactorDigits,
    fontSizeFactorCornerMarks,
    fontSizeFactorCentreMarks,
    penWidth,
    penOpacity,
    setColourPalette,
    setTheme,
    setCustomColours: setSettingsCustomColours,
    setZoom,
    setFontSizeFactorDigits,
    setFontSizeFactorCornerMarks,
    setFontSizeFactorCentreMarks,
    setPenWidth,
    setPenOpacity,
  } = useSettings(
    useShallow(state => ({
      colourPalette: state.colourPalette,
      theme: state.theme,
      customColours: state.customColours,
      zoom: state.zoom,
      fontSizeFactorDigits: state.fontSizeFactorDigits,
      fontSizeFactorCornerMarks: state.fontSizeFactorCornerMarks,
      fontSizeFactorCentreMarks: state.fontSizeFactorCentreMarks,
      penWidth: state.penWidth,
      penOpacity: state.penOpacity,
      setColourPalette: state.setColourPalette,
      setTheme: state.setTheme,
      setCustomColours: state.setCustomColours,
      setZoom: state.setZoom,
      setFontSizeFactorDigits: state.setFontSizeFactorDigits,
      setFontSizeFactorCornerMarks: state.setFontSizeFactorCornerMarks,
      setFontSizeFactorCentreMarks: state.setFontSizeFactorCentreMarks,
      setPenWidth: state.setPenWidth,
      setPenOpacity: state.setPenOpacity,
    })),
  )

  const refPlaceholderCTC = useRef<HTMLDivElement>(null)
  const refPlaceholderWong = useRef<HTMLDivElement>(null)

  const [coloursDefault, setColoursDefault] = useState<string[]>([])
  const [coloursCTC, setColoursCTC] = useState<string[]>([])
  const [coloursWong, setColoursWong] = useState<string[]>([])
  const [coloursCustom, setColoursCustom] = useState(customColours)

  function onChangeTheme(theme: string) {
    setTheme(theme)
    ;(window as any)._updateTheme()
  }

  function zoomValueToDescription(value: number) {
    if (value === 1) {
      return "Default"
    }
    return `x${value}`
  }

  function fontSizeValueToDescription(value: number): string | undefined {
    if (value === 0.75) {
      return "Tiny"
    } else if (value === 0.875) {
      return "Small"
    } else if (value === 1) {
      return "Normal"
    } else if (value === 1.125) {
      return "Large"
    } else if (value === 1.25) {
      return "X-Large"
    } else if (value === 1.375) {
      return "XX-Large"
    } else if (value === 1.5) {
      return "Maximum"
    }
    return undefined
  }

  function penWidthToDescription(value: number) {
    if (value === 2) {
      return "Default"
    }
    return `${value}`
  }

  function penOpacityToDescription(value: number) {
    if (value === 1) {
      return "Default"
    }
    return `${value}`
  }

  function onUpdateCustomColours(colours: string[]) {
    setColoursCustom(colours)
    setSettingsCustomColours(colours)
  }

  useEffect(() => {
    function makeColours(elem: Element): string[] {
      let style = getComputedStyle(elem)
      let nColours = +style.getPropertyValue("--colors")
      let result = []
      for (let i = 0; i < nColours; ++i) {
        let pos = +style.getPropertyValue(`--color-${i + 1}-pos`)
        result[pos - 1] = style.getPropertyValue(`--color-${i + 1}`)
      }
      return result
    }

    let defaultColours = makeColours(document.body)
    setColoursDefault(defaultColours)
    setColoursCTC(makeColours(refPlaceholderCTC.current!))
    setColoursWong(makeColours(refPlaceholderWong.current!))
    setColoursCustom(old => (old.length === 0 ? defaultColours : old))
  }, [])

  return (
    <div className="sidebar-page">
      <h2>Settings</h2>

      <h3>Theme</h3>
      <RadioGroup
        name="theme"
        ariaLabel="Select theme"
        value={theme}
        options={[
          {
            id: "default",
            label: "Sudocle",
          },
          {
            id: "dark",
            label: "Dark",
          },
        ]}
        onChange={onChangeTheme}
      />

      <h3>Colour Palette</h3>
      <div data-colour-palette="ctc" ref={refPlaceholderCTC} />
      <div data-colour-palette="wong" ref={refPlaceholderWong} />
      <RadioGroup
        name="colourPalette"
        ariaLabel="Select colour palette"
        value={colourPalette}
        options={[
          {
            id: "default",
            label: (
              <PaletteLabel>
                <div>Sudocle</div>
                <Palette colours={coloursDefault} />
              </PaletteLabel>
            ),
          },
          {
            id: "ctc",
            label: (
              <PaletteLabel>
                <div>Cracking the Cryptic</div>
                <Palette colours={coloursCTC} />
              </PaletteLabel>
            ),
          },
          {
            id: "wong",
            label: (
              <PaletteLabel>
                <div>Wong (optimised for colour-blindness)</div>
                <Palette colours={coloursWong} />
              </PaletteLabel>
            ),
          },
          {
            id: "custom",
            label: (
              <PaletteLabel>
                <div>Custom</div>
                <Palette
                  colours={coloursCustom}
                  customisable={true}
                  updatePalette={onUpdateCustomColours}
                />
              </PaletteLabel>
            ),
          },
        ]}
        onChange={setColourPalette}
      />

      <h3>Zoom</h3>
      <div className="mb-5 max-w-28">
        <RangeSlider
          id="range-zoom"
          min={0.9}
          max={1.25}
          step={0.05}
          value={zoom}
          onChange={setZoom}
          valueToDescription={zoomValueToDescription}
        />
      </div>

      <h3>Font sizes</h3>
      <div className="mb-1.5 max-w-28">
        <RangeSlider
          id="range-digits"
          label="Digits"
          min={0.75}
          max={1.5}
          step={0.125}
          value={fontSizeFactorDigits}
          onChange={setFontSizeFactorDigits}
          valueToDescription={fontSizeValueToDescription}
        />
      </div>
      <div className="mb-1.5 max-w-28">
        <RangeSlider
          id="range-corner-marks"
          label="Corner marks"
          min={0.75}
          max={1.5}
          step={0.125}
          value={fontSizeFactorCornerMarks}
          onChange={setFontSizeFactorCornerMarks}
          valueToDescription={fontSizeValueToDescription}
        />
      </div>
      <div className="mb-5 max-w-28">
        <RangeSlider
          id="range-centre-marks"
          label="Centre marks"
          min={0.75}
          max={1.5}
          step={0.125}
          value={fontSizeFactorCentreMarks}
          onChange={setFontSizeFactorCentreMarks}
          valueToDescription={fontSizeValueToDescription}
        />
      </div>

      <h3>Pen</h3>
      <div className="mb-1.5 max-w-28">
        <RangeSlider
          id="pen-width"
          label="Width"
          min={0.5}
          max={PEN_MAX_WIDTH}
          step={0.5}
          value={penWidth}
          onChange={setPenWidth}
          valueToDescription={penWidthToDescription}
        />
      </div>
      <div className="mb-5 max-w-28">
        <RangeSlider
          id="pen-width"
          label="Opacity"
          min={0.25}
          max={1}
          step={0.05}
          value={penOpacity}
          onChange={setPenOpacity}
          valueToDescription={penOpacityToDescription}
        />
      </div>
    </div>
  )
}

export default Settings
