import GameContext from "../components/contexts/GameContext"
import SettingsContext from "../components/contexts/SettingsContext"
import SidebarContext from "../components/contexts/SidebarContext"
import styles from "./_app.scss?type=global"
import MatomoTracker from "@datapunt/matomo-tracker-js"
import { enableMapSet } from "immer"
import { useEffect } from "react"
import type { AppProps } from "next/app"
import baloo700 from "@fontsource/baloo-2/700.css"
import roboto400 from "@fontsource/roboto/400.css"
import roboto400italic from "@fontsource/roboto/400-italic.css"
import roboto500 from "@fontsource/roboto/500.css"
import roboto500italic from "@fontsource/roboto/500-italic.css"
import roboto700 from "@fontsource/roboto/700.css"
import robotoCondensed400 from "@fontsource/roboto-condensed/400.css"

enableMapSet()

const App = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    if (
      process.env.matomoUrl !== undefined &&
      process.env.matomoSiteId !== undefined
    ) {
      let tracker = new MatomoTracker({
        urlBase: process.env.matomoUrl,
        siteId: +process.env.matomoSiteId
      })
      tracker.trackPageView()
    }
  }, [])

  return (
    <>
      <style jsx global>{`
        ${roboto400}
        ${roboto400italic}
      ${roboto500}
      ${roboto500italic}
      ${roboto700}
      ${robotoCondensed400}
      ${baloo700}
      `}</style>
      <GameContext.Provider>
        <SettingsContext.Provider>
          <SidebarContext.Provider>
            <Component {...pageProps} />
          </SidebarContext.Provider>
        </SettingsContext.Provider>
      </GameContext.Provider>
      <style jsx>{styles}</style>
    </>
  )
}

export default App
