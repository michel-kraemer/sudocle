import ColourPaletteContext from "../components/contexts/ColourPaletteContext"
import styles from "./_app.scss?type=global"

const App = ({ Component, pageProps }) => (
  <>
    <ColourPaletteContext.Provider>
      <Component {...pageProps} />
    </ColourPaletteContext.Provider>
    <style jsx>{styles}</style>
  </>
)

export default App
