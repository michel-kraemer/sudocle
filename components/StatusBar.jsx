import GameContext from "./contexts/GameContext"
import SidebarContext from "./contexts/SidebarContext"
import { ID_SETTINGS, ID_HELP, ID_ABOUT } from "./lib/SidebarTabs"
import Timer from "./Timer"
import { HelpCircle, Info, Sliders } from "lucide-react"
import { useContext } from "react"
import styles from "./StatusBar.scss"

const StatusBar = () => {
  const game = useContext(GameContext.State)
  const onTabClick = useContext(SidebarContext.OnTabClick)

  return <div className="status-bar">
    <Timer solved={game.solved} />
    <div className="menu">
      <div className="menu-item" onClick={() => onTabClick(ID_SETTINGS)}>
        <Sliders />
      </div>
      <div className="menu-item" onClick={() => onTabClick(ID_HELP)}>
        <HelpCircle />
      </div>
      <div className="menu-item" onClick={() => onTabClick(ID_ABOUT)}>
        <Info />
      </div>
    </div>
    <style jsx>{styles}</style>
  </div>
}

export default StatusBar
