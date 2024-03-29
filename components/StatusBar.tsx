import { State as GameContextState } from "./contexts/GameContext"
import { useSidebar } from "./hooks/useSidebar"
import { ID_RULES, ID_SETTINGS, ID_HELP, ID_ABOUT } from "./lib/SidebarTabs"
import Timer from "./Timer"
import { BookOpen, HelpCircle, Info, Sliders } from "lucide-react"
import { useContext } from "react"

const StatusBar = () => {
  const game = useContext(GameContextState)
  const onTabClick = useSidebar(state => state.onTabClick)

  return (
    <div className="static flex justify-center items-center w-full bg-grey-700 text-fg text-[0.8rem] font-normal h-[var(--status-bar-height)] pt-[1px] portrait:justify-between portrait:py-0 portrait:px-4">
      <Timer solved={game.solved} />
      <div className="hidden portrait:flex">
        {game.data.title !== undefined && game.data.rules !== undefined && (
          <div
            className="flex ml-2 cursor-pointer hover:text-primary"
            onClick={() => onTabClick(ID_RULES)}
          >
            <BookOpen height="1em" />
          </div>
        )}
        <div
          className="flex ml-2 cursor-pointer hover:text-primary"
          onClick={() => onTabClick(ID_SETTINGS)}
        >
          <Sliders height="1em" />
        </div>
        <div
          className="flex ml-2 cursor-pointer hover:text-primary"
          onClick={() => onTabClick(ID_HELP)}
        >
          <HelpCircle height="1em" />
        </div>
        <div
          className="flex ml-2 cursor-pointer hover:text-primary"
          onClick={() => onTabClick(ID_ABOUT)}
        >
          <Info height="1em" />
        </div>
      </div>
    </div>
  )
}

export default StatusBar
