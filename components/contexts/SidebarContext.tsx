"use client"

import { createContext, ReactNode, useState } from "react"
import { produce } from "immer"
import { ID_SETTINGS, SidebarTab } from "../lib/SidebarTabs"

interface SidebarState {
  visible: boolean
  expanded: boolean
  activeTabId: SidebarTab
}

const DEFAULT_SIDEBAR_STATE: SidebarState = {
  // true as soon as sidebar expands but only until it starts to collapse
  visible: false,

  // true as soon as sidebar expands and until it has completely collapsed
  expanded: false,

  activeTabId: ID_SETTINGS
}

export const State = createContext(DEFAULT_SIDEBAR_STATE)
export const OnTabClick = createContext((_: SidebarTab) => {})

interface ProviderProps {
  children: ReactNode
}

export const Provider = ({ children }: ProviderProps) => {
  const [state, setState] = useState(DEFAULT_SIDEBAR_STATE)

  function setExpanded(expanded: boolean) {
    setState(
      produce(draft => {
        draft.expanded = expanded
      })
    )
  }

  function onTabClick(id: SidebarTab) {
    setState(
      produce(draft => {
        if (!draft.visible) {
          draft.visible = true
          draft.expanded = true
        } else if (id === draft.activeTabId) {
          draft.visible = false
          setTimeout(() => setExpanded(false), 300)
        }

        draft.activeTabId = id
      })
    )
  }

  return (
    <State.Provider value={state}>
      <OnTabClick.Provider value={onTabClick}>{children}</OnTabClick.Provider>
    </State.Provider>
  )
}
