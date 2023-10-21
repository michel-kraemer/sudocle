"use client"

import GameContext from "../components/contexts/GameContext"
import SettingsContext from "../components/contexts/SettingsContext"
import SidebarContext from "../components/contexts/SidebarContext"
import styles from "./layout.scss?type=global"
import MatomoTracker from "@datapunt/matomo-tracker-js"
import { enableMapSet } from "immer"
import { useEffect } from "react"
import baloo700 from "@fontsource/baloo-2/700.css"
import roboto400 from "@fontsource/roboto/400.css"
import roboto400italic from "@fontsource/roboto/400-italic.css"
import roboto500 from "@fontsource/roboto/500.css"
import roboto500italic from "@fontsource/roboto/500-italic.css"
import roboto700 from "@fontsource/roboto/700.css"
import robotoCondensed400 from "@fontsource/roboto-condensed/400.css"

enableMapSet()

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children
}: {
  children: React.ReactNode
}) {
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
    <html lang="en">
      <body>
        <style jsx global>{`
          ${roboto400}
          ${roboto400italic}
          ${roboto500}
          ${roboto500italic}
          ${roboto700}
          ${robotoCondensed400}
          ${baloo700}
        `}</style>
        <style jsx>{styles}</style>
        <GameContext.Provider>
          <SettingsContext.Provider>
            <SidebarContext.Provider>{children}</SidebarContext.Provider>
          </SettingsContext.Provider>
        </GameContext.Provider>
      </body>
    </html>
  )
}
