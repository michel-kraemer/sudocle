import Sidebar from "./Sidebar"
import RadioGroup from "./RadioGroup"
import SettingsContext from "./contexts/SettingsContext"
import { useContext, useState } from "react"

const Settings = () => {
  const settings = useContext(SettingsContext.State)
  const updateSettings = useContext(SettingsContext.Dispatch)
  const [themeInternal, setThemeInternal] = useState(settings.theme)

  function onChangeTheme(theme) {
    setThemeInternal(theme)
    setTimeout(() => {
      updateSettings({ theme })
    }, 100)
  }

  return (<Sidebar>
    <h2>Settings</h2>
    <h3>Theme</h3>
    <RadioGroup name="theme" value={themeInternal} options={[{
      id: "default",
      label: "Default"
    }, {
      id: "ctc",
      label: "Cracking the Cryptic"
    }, {
      id: "dark",
      label: "Dark"
    }]} onChange={onChangeTheme} />
  </Sidebar>)
}

export default Settings
