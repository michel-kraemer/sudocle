import About from "./About"
import Help from "./Help"
import Rules from "./Rules"
import Settings from "./Settings"
import { useGame } from "./hooks/useGame"
import { useSidebar } from "./hooks/useSidebar"
import {
  ID_ABOUT,
  ID_HELP,
  ID_RULES,
  ID_SETTINGS,
  SidebarTab,
} from "./lib/SidebarTabs"
import clsx from "clsx"
import { BookOpen, HelpCircle, Info, Sliders, X } from "lucide-react"
import { ReactNode, useEffect, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"

interface Tab {
  id: SidebarTab
  icon: ReactNode
  y: number
}

const Sidebar = () => {
  const {
    activeTabId,
    visible,
    onTabClick,
    expanded: expandedDirect,
  } = useSidebar(
    useShallow(state => ({
      activeTabId: state.activeTabId,
      visible: state.visible,
      onTabClick: state.onTabClick,
      expanded: state.expanded,
    })),
  )
  const { title, rules } = useGame(state => ({
    title: state.data.title,
    rules: state.data.rules,
  }))

  const [expanded, setExpanded] = useState(expandedDirect)
  const setExpandedTimer = useRef<number>()

  useEffect(() => {
    if (setExpandedTimer.current !== undefined) {
      window.clearTimeout(setExpandedTimer.current)
      setExpandedTimer.current = undefined
    }
    if (expandedDirect) {
      setExpanded(true)
    } else {
      setExpandedTimer.current = window.setTimeout(
        () => setExpanded(false),
        300,
      )
    }
  }, [expandedDirect])

  let tabs: Tab[] = [
    {
      id: ID_SETTINGS,
      icon: <Sliders />,
      y: 0,
    },
    {
      id: ID_HELP,
      icon: <HelpCircle />,
      y: 0,
    },
    {
      id: ID_ABOUT,
      icon: <Info />,
      y: 0,
    },
  ]

  if (title !== undefined && rules !== undefined) {
    // add rules tab if game data contains rules
    tabs.unshift({
      id: ID_RULES,
      icon: <BookOpen />,
      y: 0,
    })
  }

  // reverse tabs so last element becomes lowest in z-order
  tabs.reverse()

  // calculate y position for each tab
  tabs.forEach((t, i) => (t.y = (tabs.length - i - 1) * 90))

  // move active tab to end so it will be rendered on top
  let activeTabIndex = tabs.findIndex(t => t.id === activeTabId)
  tabs = [
    ...tabs.slice(0, activeTabIndex),
    ...tabs.slice(activeTabIndex + 1),
    tabs[activeTabIndex],
  ]

  return (
    <div
      className={clsx(
        "absolute top-0 right-0 bottom-0 w-[620px] max-w-full flex z-[30000] transition-transform",
        visible
          ? "translate-x-0 duration-300 ease-in-out"
          : "translate-x-[calc(100%-2.5rem)] duration-200 ease-in",
        {
          "w-10 portrait:z-[-2000]": !expanded,
        },
      )}
    >
      <div className="w-8 mt-8 portrait:hidden">
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
              className={clsx("w-8 cursor-pointer group", {
                "fill-bg hover:fill-button-hover":
                  expanded && t.id !== activeTabId,
                "fill-primary hover:fill-primary-highlight":
                  expanded && t.id === activeTabId,
              })}
              onClick={() => onTabClick(t.id)}
            >
              <use
                xlinkHref="#tab-handle"
                className={clsx(
                  "transition-opacity duration-200 ease-in-out",
                  visible ? "opacity-100" : "opacity-0",
                )}
              />
              <g
                className={clsx(
                  "pointer-events-none",
                  expanded && t.id === activeTabId
                    ? "text-bg"
                    : "text-fg-500 group-hover:text-primary",
                )}
              >
                <g transform="translate(25, 47)">{t.icon}</g>
              </g>
            </g>
          ))}
        </svg>
      </div>
      <div
        className={clsx(
          "bg-bg/75 shadow-[-2px_0_5px_0_rgba(0_0_0/20%)] pt-4 pr-8 pb-8 pl-8 flex-1 opacity-0 transition-opacity duration-[150ms] ease-[cubic-bezier(1,0,1,0)] overflow-y-auto backdrop-blur-sm",
          {
            "opacity-100 duration-0 ease-linear": visible,
            hidden: !expanded,
          },
        )}
      >
        {expanded && activeTabId === ID_RULES && <Rules />}
        {expanded && activeTabId === ID_SETTINGS && <Settings />}
        {expanded && activeTabId === ID_HELP && <Help />}
        {expanded && activeTabId === ID_ABOUT && <About />}
      </div>
      <div
        className={clsx(
          "absolute top-8 right-8 cursor-pointer hover:text-primary",
          { hidden: !expanded },
        )}
      >
        <X size="1rem" onClick={() => onTabClick(activeTabId)} />
      </div>
    </div>
  )
}

export default Sidebar
