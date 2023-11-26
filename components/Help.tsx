import { useLayoutEffect, useState } from "react"

const Shortcuts = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center mb-5">
    {children}
  </div>
)

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="font-sans inline-block border border-fg-500 rounded-mini bg-bg/75 py-0.5 px-1 leading-tight min-w-[1.7em] text-center">
    {children}
  </kbd>
)

const Divider = () => <div className="col-span-2"></div>

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
      <Shortcuts>
        <div>
          <Key>Click</Key>
        </div>
        <div>Select cell</div>

        <div>
          <Key>Click</Key> + <Key>Drag</Key>
        </div>
        <div>Select multiple cells</div>

        <div>
          <Key>{meta}</Key> + <Key>Click</Key>
        </div>
        <div>Add cell(s) to selection</div>

        <div>
          <Key>{meta}</Key> + <Key>{shift}</Key> + <Key>Click</Key>
        </div>
        <div>Deselect cell(s)</div>

        <div>
          <Key>{alt}</Key> + <Key>Double click</Key>
        </div>
        <div>Select cells with same colour</div>
      </Shortcuts>

      <h3>Keyboard shortcuts</h3>
      <Shortcuts>
        <div>
          <Key>0</Key> &ndash; <Key>9</Key>
        </div>
        <div>Enter digit</div>

        <div>
          <Key>{shift}</Key> + ( <Key>0</Key> &ndash; <Key>9</Key> )
        </div>
        <div>Enter corner mark</div>

        <div>
          <Key>{meta}</Key> + ( <Key>0</Key> &ndash; <Key>9</Key> )
        </div>
        <div>Enter centre mark</div>

        <div>
          <Key>{del}</Key>
        </div>
        <div>Delete digit/mark/colour</div>

        <Divider />

        <div>
          <Key>{meta}</Key> + <Key>Z</Key>
        </div>
        <div>Undo</div>

        <div>
          <Key>{meta}</Key> + <Key>{shift}</Key> + <Key>Z</Key>
          <br />
          <div className="mt-1 before:content-['or'] before:mr-[0.4rem]">
            <Key>{meta}</Key> + <Key>Y</Key>
          </div>
        </div>
        <div>Redo</div>

        <Divider />

        <div>
          <Key>Space</Key>
        </div>
        <div>Switch to next mode in group</div>

        <div>
          <Key>{tab}</Key>
        </div>
        <div>Toggle mode group</div>

        <div>
          <Key>{keyZ.toUpperCase()}</Key>
        </div>
        <div>Digit mode (Group 1)</div>

        <div>
          <Key>{keyX.toUpperCase()}</Key>
        </div>
        <div>Corner mark mode (Group 1)</div>

        <div>
          <Key>{keyC.toUpperCase()}</Key>
        </div>
        <div>Centre mark mode (Group 1)</div>

        <div>
          <Key>{keyV.toUpperCase()}</Key>
        </div>
        <div>Colour mode (Group 1)</div>

        <div>
          <Key>{keyP.toUpperCase()}</Key>
        </div>
        <div>Pen mode (Group 2)</div>

        <Divider />

        <div>
          <Key>{meta}</Key> + <Key>A</Key>
        </div>
        <div>Select all cells</div>

        <div>
          <Key>&#x2190;</Key>, <Key>&#x2191;</Key>, <Key>&#x2192;</Key>,{" "}
          <Key>&#x2193;</Key>
        </div>
        <div>Move selection</div>

        <div>
          <Key>{meta}</Key> + ( <Key>&#x2190;</Key> &ndash; <Key>&#x2193;</Key>{" "}
          )
        </div>
        <div>Add to selection</div>
      </Shortcuts>
    </div>
  )
}

export default Help
