import { ID_SETTINGS, SidebarTab } from "../lib/SidebarTabs"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface SidebarState {
  // true as soon as sidebar expands but only until it starts to collapse
  visible: boolean

  // true as soon as sidebar expands and until it has completely collapsed
  expanded: boolean

  activeTabId: SidebarTab

  setExpanded(expanded: boolean): void
  onTabClick(id: SidebarTab): void
}

export const useSidebar = create<SidebarState>()(
  immer(set => ({
    visible: false,
    expanded: false,
    activeTabId: ID_SETTINGS,

    setExpanded: (expanded: boolean) =>
      set(draft => {
        draft.expanded = expanded
      }),

    onTabClick: (id: SidebarTab) =>
      set(draft => {
        if (!draft.visible) {
          draft.visible = true
          draft.expanded = true
        } else if (id === draft.activeTabId) {
          draft.visible = false
          draft.expanded = false
        }

        draft.activeTabId = id
      }),
  })),
)
