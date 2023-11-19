import classNames from "classnames"
import { Provider as GameContextProvider } from "../components/contexts/GameContext"
import { Provider as SettingsContextProvider } from "../components/contexts/SettingsContext"
import { Provider as SidebarContextProvider } from "../components/contexts/SidebarContext"
import "../css/main.css"
import "../css/themes.css"
import "../css/colour-palettes.css"
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
        <GameContextProvider>
          <SettingsContextProvider>
            <SidebarContextProvider>{children}</SidebarContextProvider>
          </SettingsContextProvider>
        </GameContextProvider>
        <MatomoInit />
      </body>
    </html>
  )
}
