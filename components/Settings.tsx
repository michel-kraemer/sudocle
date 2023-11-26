import Palette from "./Palette"
import RadioGroup from "./RadioGroup"
import RangeSlider from "./RangeSlider"
import {
  Dispatch as SettingsContextDispatch,
  State as SettingsContextState
} from "./contexts/SettingsContext"
import { useContext, useEffect, useRef, useState } from "react"

const Slider = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 max-w-[7rem]">{children}</div>
)

const PaletteLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-start">{children}</div>
)

const Settings = () => {
  const settings = useContext(SettingsContextState)
  const updateSettings = useContext(SettingsContextDispatch)
  const [themeInternal, setThemeInternal] = useState(settings.theme)

  const refPlaceholderCTC = useRef<HTMLDivElement>(null)
  const refPlaceholderWong = useRef<HTMLDivElement>(null)

  const [coloursDefault, setColoursDefault] = useState<string[]>([])
  const [coloursCTC, setColoursCTC] = useState<string[]>([])
  const [coloursWong, setColoursWong] = useState<string[]>([])
  const [coloursCustom, setColoursCustom] = useState(settings.customColours)

  function onChangeTheme(theme: string) {
    setThemeInternal(theme)
    setTimeout(() => {
      updateSettings({ theme })
    }, 100)
  }

  const changeZoomTimeout = useRef<number>()
  function onChangeZoom(value: number) {
    if (changeZoomTimeout.current !== undefined) {
      clearTimeout(changeZoomTimeout.current)
    }
    changeZoomTimeout.current = window.setTimeout(() => {
      updateSettings({ zoom: value })
    }, 200)
  }

  function zoomValueToDescription(value: number) {
    if (value === 1) {
      return "Default"
    }
    return `x${value}`
  }

  function onChangeFontSizeDigits(value: number) {
    updateSettings({ fontSizeFactorDigits: value })
  }

  function onChangeFontSizeCornerMarks(value: number) {
    updateSettings({ fontSizeFactorCornerMarks: value })
  }

  function onChangeFontSizeCentreMarks(value: number) {
    updateSettings({ fontSizeFactorCentreMarks: value })
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

  function onUpdateCustomColours(colours: string[]) {
    setColoursCustom(colours)
    updateSettings({ customColours: colours })
  }

  useEffect(() => {
    setThemeInternal(settings.theme)
  }, [settings.theme])

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
        value={themeInternal}
        options={[
          {
            id: "default",
            label: "Sudocle"
          },
          {
            id: "dark",
            label: "Dark"
          }
        ]}
        onChange={onChangeTheme}
      />

      <h3>Colour Palette</h3>
      <div data-colour-palette="ctc" ref={refPlaceholderCTC} />
      <div data-colour-palette="wong" ref={refPlaceholderWong} />
      <RadioGroup
        name="colourPalette"
        value={settings.colourPalette}
        options={[
          {
            id: "default",
            label: (
              <PaletteLabel>
                <div>Sudocle</div>
                <Palette colours={coloursDefault} />
              </PaletteLabel>
            )
          },
          {
            id: "ctc",
            label: (
              <PaletteLabel>
                <div>Cracking the Cryptic</div>
                <Palette colours={coloursCTC} />
              </PaletteLabel>
            )
          },
          {
            id: "wong",
            label: (
              <PaletteLabel>
                <div>Wong (optimised for colour-blindness)</div>
                <Palette colours={coloursWong} />
              </PaletteLabel>
            )
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
            )
          }
        ]}
        onChange={colourPalette => updateSettings({ colourPalette })}
      />

      <h3>Zoom</h3>
      <Slider>
        <RangeSlider
          id="range-zoom"
          min={0.9}
          max={1.25}
          step={0.05}
          value={settings.zoom}
          onChange={onChangeZoom}
          valueToDescription={zoomValueToDescription}
        />
      </Slider>

      <h3>Font sizes</h3>
      <Slider>
        <RangeSlider
          id="range-digits"
          label="Digits"
          min={0.75}
          max={1.5}
          step={0.125}
          value={settings.fontSizeFactorDigits}
          onChange={onChangeFontSizeDigits}
          valueToDescription={fontSizeValueToDescription}
        />
      </Slider>
      <Slider>
        <RangeSlider
          id="range-corner-marks"
          label="Corner marks"
          min={0.75}
          max={1.5}
          step={0.125}
          value={settings.fontSizeFactorCornerMarks}
          onChange={onChangeFontSizeCornerMarks}
          valueToDescription={fontSizeValueToDescription}
        />
      </Slider>
      <Slider>
        <RangeSlider
          id="range-centre-marks"
          label="Centre marks"
          min={0.75}
          max={1.5}
          step={0.125}
          value={settings.fontSizeFactorCentreMarks}
          onChange={onChangeFontSizeCentreMarks}
          valueToDescription={fontSizeValueToDescription}
        />
      </Slider>
    </div>
  )
}

export default Settings
