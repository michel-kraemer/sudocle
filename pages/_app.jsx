import GameContext from "../components/contexts/GameContext"
import SettingsContext from "../components/contexts/SettingsContext"
import styles from "./_app.scss?type=global"
import { enableAllPlugins } from "immer"

enableAllPlugins()

const App = ({ Component, pageProps }) => (
  <>
    <GameContext.Provider>
      <SettingsContext.Provider>
        <Component {...pageProps} />
      </SettingsContext.Provider>
    </GameContext.Provider>
    <style jsx>{styles}</style>
  </>
)

export default App
