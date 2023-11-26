import classNames from "classnames"
import { Provider as GameContextProvider } from "../components/contexts/GameContext"
import { Provider as SettingsContextProvider } from "../components/contexts/SettingsContext"
import { Provider as SidebarContextProvider } from "../components/contexts/SidebarContext"
import "../css/main.css"
import "../css/themes.css"
import "../css/colour-palettes.css"
import MatomoInit from "../components/MatomoInit"
import { Baloo_2, Roboto, Roboto_Condensed } from "next/font/google"
import type { Metadata } from "next"

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

export const metadata: Metadata = {
  title: "Sudocle",
  description: "A modern web app for Sudoku inspired by Cracking the Cryptic"
}

// TODO enable this after upgrade to Next 14
// export const viewport: Viewport = {
//   width: "device-width",
//   initialScale: 1,
//   shrinkToFit: "no"
// }

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
      <head>
        <link
          rel="shortcut icon"
          href={`${process.env.basePath}/favicons/favicon.ico`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${process.env.basePath}/favicons/favicon-16x16.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${process.env.basePath}/favicons/favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="48x48"
          href={`${process.env.basePath}/favicons/favicon-48x48.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href={`${process.env.basePath}/favicons/apple-touch-icon-57x57.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href={`${process.env.basePath}/favicons/apple-touch-icon-60x60.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href={`${process.env.basePath}/favicons/apple-touch-icon-72x72.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href={`${process.env.basePath}/favicons/apple-touch-icon-76x76.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href={`${process.env.basePath}/favicons/apple-touch-icon-114x114.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href={`${process.env.basePath}/favicons/apple-touch-icon-120x120.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href={`${process.env.basePath}/favicons/apple-touch-icon-144x144.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href={`${process.env.basePath}/favicons/apple-touch-icon-152x152.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href={`${process.env.basePath}/favicons/apple-touch-icon-167x167.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${process.env.basePath}/favicons/apple-touch-icon-180x180.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="1024x1024"
          href={`${process.env.basePath}/favicons/apple-touch-icon-1024x1024.png`}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Sudocle" />
      </head>
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
