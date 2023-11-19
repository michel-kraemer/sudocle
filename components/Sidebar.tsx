import About from "./About"
import Help from "./Help"
import Rules from "./Rules"
import Settings from "./Settings"
import { State as GameContextState } from "./contexts/GameContext"
import {
  State as SidebarContextState,
  OnTabClick
} from "./contexts/SidebarContext"
import classNames from "classnames"
import { BookOpen, HelpCircle, Info, Sliders, X } from "lucide-react"
import { ReactNode, useContext } from "react"
import {
  ID_RULES,
  ID_SETTINGS,
  ID_HELP,
  ID_ABOUT,
  SidebarTab
} from "./lib/SidebarTabs"
import styles from "./Sidebar.oscss"

interface Tab {
  id: SidebarTab
  icon: ReactNode
  y: number
}

const Sidebar = () => {
  const sidebarState = useContext(SidebarContextState)
  const onTabClick = useContext(OnTabClick)
  const game = useContext(GameContextState)

  let tabs: Tab[] = [
    {
      id: ID_SETTINGS,
      icon: <Sliders />,
      y: 0
    },
    {
      id: ID_HELP,
      icon: <HelpCircle />,
      y: 0
    },
    {
      id: ID_ABOUT,
      icon: <Info />,
      y: 0
    }
  ]

  if (game.data.title !== undefined && game.data.rules !== undefined) {
    // add rules tab if game data contains rules
    tabs.unshift({
      id: ID_RULES,
      icon: <BookOpen />,
      y: 0
    })
  }

  // reverse tabs so last element becomes lowest in z-order
  tabs.reverse()

  // calculate y position for each tab
  tabs.forEach((t, i) => (t.y = (tabs.length - i - 1) * 90))

  // move active tab to end so it will be rendered on top
  let activeTabIndex = tabs.findIndex(t => t.id === sidebarState.activeTabId)
  tabs = [
    ...tabs.slice(0, activeTabIndex),
    ...tabs.slice(activeTabIndex + 1),
    tabs[activeTabIndex]
  ]

  return (
    <div
      className={classNames("sidebar", {
        visible: sidebarState.visible,
        expanded: sidebarState.expanded,
        collapsed: !sidebarState.expanded
      })}
    >
      <div className="sidebar-tabs">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 500">
          <defs>
            <filter id="shadow" x="-20%" y="-20%" height="140%" width="140%">
              <feDropShadow
                dx="-1"
                dy="1"
                stdDeviation="1"
                floodOpacity="0.3"
              />
            </filter>
            <path
              id="tab-handle"
              filter="url(#shadow)"
              d="M60,118l-12.4-6.6L16.1,94.7c-3.7-2-6-5.8-6-10V33.6c0-4.2,2.3-8,6-10L49.2,6L60,0.2V118z"
            />
          </defs>
          {tabs.map(t => (
            <g
              key={t.id}
              transform={`translate(0, ${t.y})`}
              className={classNames("tab-handle", {
                active: t.id === sidebarState.activeTabId
              })}
              onClick={() => onTabClick(t.id)}
            >
              <use xlinkHref="#tab-handle" className="tab-handle-path" />
              <g className="tab-icon">
                <g transform="translate(25, 47)">{t.icon}</g>
              </g>
            </g>
          ))}
        </svg>
      </div>
      <div className="sidebar-container">
        {sidebarState.expanded && sidebarState.activeTabId === ID_RULES && (
          <Rules />
        )}
        {sidebarState.expanded && sidebarState.activeTabId === ID_SETTINGS && (
          <Settings />
        )}
        {sidebarState.expanded && sidebarState.activeTabId === ID_HELP && (
          <Help />
        )}
        {sidebarState.expanded && sidebarState.activeTabId === ID_ABOUT && (
          <About />
        )}
      </div>
      <div className="close-button">
        <X size="1rem" onClick={() => onTabClick(sidebarState.activeTabId)} />
      </div>
      <style jsx>{styles}</style>
    </div>
  )
}

export default Sidebar
