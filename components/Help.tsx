import { useLayoutEffect, useState } from "react"
import styles from "./Help.oscss"

const Help = () => {
  const [isApple, setIsApple] = useState(false)
  const [keyZ, setKeyZ] = useState("z")
  const [keyX, setKeyX] = useState("x")
  const [keyC, setKeyC] = useState("c")
  const [keyV, setKeyV] = useState("v")
  const [keyP, setKeyP] = useState("p")

  async function getKeyboardKey(key: string, def: string): Promise<string> {
    if (typeof navigator !== "undefined") {
      let nany = navigator as any
      if (nany.keyboard?.getLayoutMap !== undefined) {
        let layoutMap = await nany.keyboard.getLayoutMap()
        if (layoutMap !== undefined) {
          return layoutMap.get(key) || def
        }
      }
    }
    return def
  }

  useLayoutEffect(() => {
    if (typeof navigator !== "undefined" && navigator.platform !== undefined) {
      let p = navigator.platform.toLowerCase()
      if (p.includes("mac") || p.includes("iphone") || p.includes("ipad")) {
        setIsApple(true)
      }
    }

    async function getInternationalKeyboardKeys() {
      setKeyZ(await getKeyboardKey("KeyZ", "z"))
      setKeyX(await getKeyboardKey("KeyX", "x"))
      setKeyC(await getKeyboardKey("KeyC", "c"))
      setKeyV(await getKeyboardKey("KeyV", "v"))
      setKeyP(await getKeyboardKey("KeyP", "p"))
    }

    getInternationalKeyboardKeys()
  }, [])

  let meta = isApple ? <>&#8984;</> : "Ctrl"
  let alt = isApple ? <>&#8997;</> : "Alt"
  let del = isApple ? <>&#9003;</> : "Delete"
  let tab = isApple ? <>&#x21e5;</> : "Tab"
  let shift = <>&#x21e7;</>

  return (
    <div className="sidebar-page">
      <h2>Help</h2>

      <h3>Mouse</h3>
      <div className="shortcuts">
        <div className="key">
          <kbd>Click</kbd>
        </div>
        <div className="desc">Select cell</div>

        <div className="key">
          <kbd>Click</kbd> + <kbd>Drag</kbd>
        </div>
        <div className="desc">Select multiple cells</div>

        <div className="key">
          <kbd>{meta}</kbd> + <kbd>Click</kbd>
        </div>
        <div className="desc">Add cell(s) to selection</div>

        <div className="key">
          <kbd>{meta}</kbd> + <kbd>{shift}</kbd> + <kbd>Click</kbd>
        </div>
        <div className="desc">Deselect cell(s)</div>

        <div className="key">
          <kbd>{alt}</kbd> + <kbd>Double click</kbd>
        </div>
        <div className="desc">Select cells with same colour</div>
      </div>

      <h3>Keyboard shortcuts</h3>
      <div className="shortcuts">
        <div className="key">
          <kbd>0</kbd> &ndash; <kbd>9</kbd>
        </div>
        <div className="desc">Enter digit</div>

        <div className="key">
          <kbd>{shift}</kbd> + ( <kbd>0</kbd> &ndash; <kbd>9</kbd> )
        </div>
        <div className="desc">Enter corner mark</div>

        <div className="key">
          <kbd>{meta}</kbd> + ( <kbd>0</kbd> &ndash; <kbd>9</kbd> )
        </div>
        <div className="desc">Enter centre mark</div>

        <div className="key">
          <kbd>{del}</kbd>
        </div>
        <div className="desc">Delete digit/mark/colour</div>

        <div className="divider"></div>

        <div className="key">
          <kbd>{meta}</kbd> + <kbd>Z</kbd>
        </div>
        <div className="desc">Undo</div>

        <div className="key">
          <kbd>{meta}</kbd> + <kbd>{shift}</kbd> + <kbd>Z</kbd>
          <br />
          <div className="alt-key">
            <kbd>{meta}</kbd> + <kbd>Y</kbd>
          </div>
        </div>
        <div className="desc">Redo</div>

        <div className="divider"></div>

        <div className="key">
          <kbd>Space</kbd>
        </div>
        <div className="desc">Switch to next mode in group</div>

        <div className="key">
          <kbd>{tab}</kbd>
        </div>
        <div className="desc">Toggle mode group</div>

        <div className="key">
          <kbd>{keyZ.toUpperCase()}</kbd>
        </div>
        <div className="desc">Digit mode (Group 1)</div>

        <div className="key">
          <kbd>{keyX.toUpperCase()}</kbd>
        </div>
        <div className="desc">Corner mark mode (Group 1)</div>

        <div className="key">
          <kbd>{keyC.toUpperCase()}</kbd>
        </div>
        <div className="desc">Centre mark mode (Group 1)</div>

        <div className="key">
          <kbd>{keyV.toUpperCase()}</kbd>
        </div>
        <div className="desc">Colour mode (Group 1)</div>

        <div className="key">
          <kbd>{keyP.toUpperCase()}</kbd>
        </div>
        <div className="desc">Pen mode (Group 2)</div>

        <div className="divider"></div>

        <div className="key">
          <kbd>{meta}</kbd> + <kbd>A</kbd>
        </div>
        <div className="desc">Select all cells</div>

        <div className="key">
          <kbd>&#x2190;</kbd>, <kbd>&#x2191;</kbd>, <kbd>&#x2192;</kbd>,{" "}
          <kbd>&#x2193;</kbd>
        </div>
        <div className="desc">Move selection</div>

        <div className="key">
          <kbd>{meta}</kbd> + ( <kbd>&#x2190;</kbd> &ndash; <kbd>&#x2193;</kbd>{" "}
          )
        </div>
        <div className="desc">Add to selection</div>
      </div>
      <style jsx>{styles}</style>
    </div>
  )
}

export default Help
