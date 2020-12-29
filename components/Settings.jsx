import RadioGroup from "./RadioGroup"
import SettingsContext from "./contexts/SettingsContext"
import { useContext, useEffect, useRef, useState } from "react"
import styles from "./Settings.scss"

function Palette({ colours }) {
  return <div className="palette">{
    colours.map((c, i) => <div key={i} className="colour" style={{ backgroundColor: c }}></div>)
  }<style jsx>{styles}</style></div>
}

const Settings = () => {
  const settings = useContext(SettingsContext.State)
  const updateSettings = useContext(SettingsContext.Dispatch)
  const [themeInternal, setThemeInternal] = useState(settings.theme)

  const refPlaceholderCTC = useRef()
  const refPlaceholderWong = useRef()

  const [coloursDefault, setColoursDefault] = useState([])
  const [coloursCTC, setColoursCTC] = useState([])
  const [coloursWong, setColoursWong] = useState([])

  function onChangeTheme(theme) {
    setThemeInternal(theme)
    setTimeout(() => {
      updateSettings({ theme })
    }, 100)
  }

  useEffect(() => {
    setThemeInternal(settings.theme)
  }, [settings.theme])

  useEffect(() => {
    let defaultStyle = getComputedStyle(document.body)
    let newColoursDefault = []
    for (let i = 0; i < 9; ++i) {
      newColoursDefault[i] = defaultStyle.getPropertyValue(`--color-${i + 1}`)
    }
    setColoursDefault(newColoursDefault)

    let ctcStyle = getComputedStyle(refPlaceholderCTC.current)
    let newColoursCTC = []
    for (let i = 0; i < 9; ++i) {
      newColoursCTC[i] = ctcStyle.getPropertyValue(`--color-${i + 1}`)
    }
    setColoursCTC(newColoursCTC)

    let wongStyle = getComputedStyle(refPlaceholderWong.current)
    let newColoursWong = []
    for (let i = 0; i < 9; ++i) {
      newColoursWong[i] = wongStyle.getPropertyValue(`--color-${i + 1}`)
    }
    setColoursWong(newColoursWong)
  }, [])

  return (<>
    <h2>Settings</h2>

    <h3>Theme</h3>
    <RadioGroup name="theme" value={themeInternal} options={[{
      id: "default",
      label: "Modern"
    }, {
      id: "ctc",
      label: "Cracking the Cryptic"
    }, {
      id: "dark",
      label: "Dark"
    }]} onChange={onChangeTheme} />

    <h3>Colour Palette</h3>
    <div className="palette-placeholder" data-colour-palette="ctc" ref={refPlaceholderCTC} />
    <div className="palette-placeholder" data-colour-palette="wong" ref={refPlaceholderWong} />
    <RadioGroup name="colourPalette" value={settings.colourPalette} options={[{
      id: "default",
      label: <div className="palette-label"><div>Modern</div>
        <Palette colours={coloursDefault} /></div>
    }, {
      id: "ctc",
      label: <div className="palette-label"><div>Cracking the Cryptic</div>
        <Palette colours={coloursCTC} /></div>
    }, {
      id: "wong",
      label: <div className="palette-label"><div>Wong (optimised for colour-blindness)</div>
        <Palette colours={coloursWong} /></div>
    }]} onChange={(colourPalette) => updateSettings({ colourPalette })} />
    <style jsx>{styles}</style>
  </>)
}

export default Settings
