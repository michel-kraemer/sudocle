"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

if (
  typeof window !== "undefined" &&
  process.env.matomoUrl !== undefined &&
  process.env.matomoSiteId !== undefined
) {
  // Matomo tracker code
  let _paq = ((window as any)._paq = (window as any)._paq || [])
  _paq.push(["setTrackerUrl", process.env.matomoUrl! + "matomo.php"])
  _paq.push(["setSiteId", process.env.matomoSiteId!])
  let g = document.createElement("script")
  let s = document.getElementsByTagName("script")[0]
  g.async = true
  g.src = process.env.matomoUrl! + "matomo.js"
  s.parentNode!.insertBefore(g, s)
}

const MatomoInit = () => {
  const pathname = usePathname()
  const previousPathname = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (previousPathname.current === pathname) {
      // don't track the same page twice
      return
    }

    let _paq = ((window as any)._paq = (window as any)._paq || [])

    if (previousPathname.current !== undefined) {
      _paq.push(["setReferrerUrl", previousPathname.current])
    }
    previousPathname.current = pathname

    _paq.push(["setCustomUrl", pathname])
    _paq.push(["setDocumentTitle", document.title])

    // accurately measure the time spent in the visit
    _paq.push(["enableHeartBeatTimer"])

    _paq.push(["trackPageView"])

    // enable download and outlink tracking
    _paq.push(["enableLinkTracking"])
  }, [pathname])

  return <></>
}

export default MatomoInit
