"use client"

import GameContext from "../components/contexts/GameContext"
import SettingsContext from "../components/contexts/SettingsContext"
import SidebarContext from "../components/contexts/SidebarContext"
import styles from "./layout.scss?type=global"
import { enableMapSet } from "immer"
import classNames from "classnames"
import MatomoInit from "../components/MatomoInit"
import { Baloo_2, Roboto, Roboto_Condensed } from "next/font/google"

const baloo = Baloo_2({
  weight: ["700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap", // force "swap" even in production mode
  variable: "--font-baloo"
})

const roboto = Roboto({
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap", // force "swap" even in production mode
  variable: "--font-roboto"
})

enableMapSet()

const robotoCondensed = Roboto_Condensed({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap", // force "swap" even in production mode
  variable: "--font-roboto-condensed"
})

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={classNames(
        `${baloo.variable} ${roboto.variable} ${robotoCondensed.variable}`
      )}
    >
      <body>
        <style jsx>{styles}</style>
        <GameContext.Provider>
          <SettingsContext.Provider>
            <SidebarContext.Provider>{children}</SidebarContext.Provider>
          </SettingsContext.Provider>
        </GameContext.Provider>
        <MatomoInit />
      </body>
    </html>
  )
}
