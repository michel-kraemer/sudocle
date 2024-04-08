import Timer from "./Timer"
import { useGame } from "./hooks/useGame"
import { useSidebar } from "./hooks/useSidebar"
import { ID_ABOUT, ID_HELP, ID_RULES, ID_SETTINGS } from "./lib/SidebarTabs"
import { BookOpen, HelpCircle, Info, Sliders } from "lucide-react"

const StatusBar = () => {
  const { title, rules, solved } = useGame(state => ({
    title: state.data.title,
    rules: state.data.rules,
    solved: state.solved,
  }))
  const onTabClick = useSidebar(state => state.onTabClick)

  return (
    <div className="static flex justify-center items-center w-full bg-grey-700 text-fg text-[0.8rem] font-normal h-[var(--status-bar-height)] pt-[1px] portrait:justify-between portrait:py-0 portrait:px-4">
      <Timer solved={solved} />
      <div className="hidden portrait:flex">
        {title !== undefined && rules !== undefined && (
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
