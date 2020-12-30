import About from "./About"
import Help from "./Help"
import Settings from "./Settings"
import classNames from "classnames"
import { HelpCircle, Info, Sliders, X } from "lucide-react"
import { useState } from "react"
import styles from "./Sidebar.scss"

const ID_SETTINGS = "settings"
const ID_HELP = "help"
const ID_ABOUT = "about"

const Sidebar = () => {
  // true as soon as sidebar expands but only until it starts to collapse
  const [visible, setVisible] = useState(false)

  // true as soon as sidebar expands and until it has completely collapsed
  const [expanded, setExpanded] = useState(false)

  const [activeTabId, setActiveTabId] = useState(ID_SETTINGS)

  function onTabClick(id) {
    if (!visible) {
      setVisible(true)
      setExpanded(true)
    } else if (id === activeTabId) {
      setVisible(false)
      setTimeout(() => setExpanded(false), 300)
    }

    setActiveTabId(id)
  }

  let tabs = [{
    id: ID_SETTINGS,
    icon: <Sliders />
  }, {
    id: ID_HELP,
    icon: <HelpCircle />
  }, {
    id: ID_ABOUT,
    icon: <Info />
  }]

  // reverse tabs so last element becomes lowest in z-order
  tabs.reverse()

  // calculate y position for each tab
  tabs.forEach((t, i) => t.y = (tabs.length - i - 1) * 90)

  // move active tab to end so it will be rendered on top
  let activeTabIndex = tabs.findIndex(t => t.id === activeTabId)
  tabs = [...tabs.slice(0, activeTabIndex), ...tabs.slice(activeTabIndex + 1), tabs[activeTabIndex]]

  return (<div className={classNames("sidebar", { visible, expanded, collapsed: !expanded })}>
    <div className="sidebar-tabs">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 500">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" height="140%" width="140%">
            <feDropShadow dx="-1" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
          <path id="tab-handle" filter="url(#shadow)"
            d="M60,118l-12.4-6.6L16.1,94.7c-3.7-2-6-5.8-6-10V33.6c0-4.2,2.3-8,6-10L49.2,6L60,0.2V118z"/>
        </defs>
        {tabs.map(t => (
          <g key={t.id} transform={`translate(0, ${t.y})`}
              className={classNames("tab-handle", { active: t.id === activeTabId })}
              onClick={() => onTabClick(t.id)}>
            <use xlinkHref="#tab-handle" className="tab-handle-path" />
            <g className="tab-icon">
              <g transform="translate(25, 47)">
                {t.icon}
              </g>
            </g>
          </g>
        ))}
      </svg>
    </div>
    <div className="sidebar-container">
      {expanded && activeTabId === ID_SETTINGS && <Settings />}
      {expanded && activeTabId === ID_HELP && <Help />}
      {expanded && activeTabId === ID_ABOUT && <About />}
    </div>
    <div className="close-button">
      <X size="1rem" onClick={() => onTabClick(activeTabId)} />
    </div>
    <style jsx>{styles}</style>
  </div>)
}

export default Sidebar
