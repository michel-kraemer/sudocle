import { State as GameContextState } from "./contexts/GameContext"
import { OnTabClick } from "./contexts/SidebarContext"
import { ID_RULES, ID_SETTINGS, ID_HELP, ID_ABOUT } from "./lib/SidebarTabs"
import Timer from "./Timer"
import { BookOpen, HelpCircle, Info, Sliders } from "lucide-react"
import { useContext } from "react"
import styles from "./StatusBar.oscss"

const StatusBar = () => {
  const game = useContext(GameContextState)
  const onTabClick = useContext(OnTabClick)

  return (
    <div className="status-bar">
      <Timer solved={game.solved} />
      <div className="menu">
        {game.data.title !== undefined && game.data.rules !== undefined && (
          <div className="menu-item" onClick={() => onTabClick(ID_RULES)}>
            <BookOpen />
          </div>
        )}
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
  )
}

export default StatusBar
