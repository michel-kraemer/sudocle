import MatomoInit from "../components/MatomoInit"
import "../css/colour-palettes.css"
import "../css/main.css"
import clsx from "clsx"
import type { Metadata } from "next"
import { Baloo_2, Roboto, Roboto_Condensed } from "next/font/google"

const baloo = Baloo_2({
  weight: ["700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap", // force "swap" even in production mode
  variable: "--font-baloo",
})

const roboto = Roboto({
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap", // force "swap" even in production mode
  variable: "--font-roboto",
})

const robotoCondensed = Roboto_Condensed({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap", // force "swap" even in production mode
  variable: "--font-roboto-condensed",
})

export const metadata: Metadata = {
  title: "Sudocle",
  description: "A modern web app for Sudoku inspired by Cracking the Cryptic",
}

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={clsx(
        `${baloo.variable} ${roboto.variable} ${robotoCondensed.variable}`,
      )}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (!('_updateTheme' in window)) {
                window._updateTheme = function updateTheme(theme) {
                  if ("SudocleSettings" in localStorage && JSON.parse(localStorage.SudocleSettings).state?.theme === "dark") {
                    document.documentElement.classList.add("dark")
                  } else {
                    document.documentElement.classList.remove("dark")
                  }
                }
              }
              try {
                _updateTheme()
              } catch (_) {}
            `,
          }}
        />
        <link
          rel="shortcut icon"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/favicon.ico`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/favicon-16x16.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="48x48"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/favicon-48x48.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-57x57.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-60x60.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-72x72.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-76x76.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-114x114.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-120x120.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-144x144.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-152x152.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-167x167.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-180x180.png`}
        />
        <link
          rel="apple-touch-icon"
          sizes="1024x1024"
          href={`${process.env.__NEXT_ROUTER_BASEPATH}/favicons/apple-touch-icon-1024x1024.png`}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Sudocle" />
      </head>
      <body>
        {children}
        <MatomoInit />
      </body>
    </html>
  )
}
