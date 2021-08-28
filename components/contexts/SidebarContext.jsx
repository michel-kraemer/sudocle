import { createContext, useState } from "react"
import { produce } from "immer"
import { ID_SETTINGS } from "../lib/SidebarTabs"

const State = createContext()
const OnTabClick = createContext()

const Provider = ({ children }) => {
  const [state, setState] = useState({
    // true as soon as sidebar expands but only until it starts to collapse
    visible: false,

    // true as soon as sidebar expands and until it has completely collapsed
    expanded: false,

    activeTabId: ID_SETTINGS
  })

  function setExpanded(expanded) {
    setState(produce(draft => {
      draft.expanded = expanded
    }))
  }

  function onTabClick(id) {
    setState(produce(draft => {
      if (!draft.visible) {
        draft.visible = true
        draft.expanded = true
      } else if (id === draft.activeTabId) {
        draft.visible = false
        setTimeout(() => setExpanded(false), 300)
      }

      draft.activeTabId = id
    }))
  }

  return (
    <State.Provider value={state}>
      <OnTabClick.Provider value={onTabClick}>{children}</OnTabClick.Provider>
    </State.Provider>
  )
}

const SidebarContext = {
  State,
  OnTabClick,
  Provider
}

export default SidebarContext
