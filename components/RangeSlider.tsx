import { ReactNode, useState } from "react"
import * as Slider from "@radix-ui/react-slider"
import clsx from "clsx"

interface RangeSliderProps {
  id: string
  min?: number
  max?: number
  step?: number
  label?: ReactNode
  value: number
  onChange: (value: number) => void
  valueChangeOnMouseUp?: boolean
  valueToDescription: (value: number) => string | undefined
}

const RangeSlider = ({
  id,
  min = 0,
  max = 10,
  step = 1,
  label,
  value,
  onChange,
  valueToDescription
}: RangeSliderProps) => {
  const [currentValue, setCurrentValue] = useState(value)

  const [description, setDescription] = useState<string>()
  const [descriptionVisible, setDescriptionVisible] = useState(false)
  const [descriptionPosition, setDescriptionPosition] = useState(0)

  function onChangeInternal(newValue: number[]) {
    let v = newValue[0]
    setCurrentValue(v)
    if (onChange) {
      onChange(v)
    }

    if (valueToDescription) {
      setDescription(valueToDescription(v))
    } else {
      setDescription(`${v}`)
    }
    setDescriptionPosition(((v - min) * 100) / (max - min))
  }

  function onPointerDown() {
    setDescriptionVisible(true)
  }

  function onPointerUp() {
    setDescriptionVisible(false)
  }

  return (
    <>
      <form className="flex h-4 flex-col">
        <label htmlFor={id} className="block mb-1">
          {label}
        </label>
        <div className="relative">
          <Slider.Root
            id={id}
            className="relative flex items-center select-none touch-none w-full h-2"
            value={[currentValue]}
            onValueChange={onChangeInternal}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            min={min}
            max={max}
            step={step}
          >
            <Slider.Track className="bg-grey-600 relative grow rounded h-[0.29rem]">
              <Slider.Range className="absolute bg-white rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-[0.6rem] h-[0.6rem] bg-primary rounded hover:bg-violet3 focus:outline-none"
              aria-label="Volume"
            />
          </Slider.Root>
          {description && (
            <div className="absolute bottom-[0.8rem] left-[0.3rem] right-[0.3rem]">
              <div
                className={clsx(
                  "relative rounded-mini transition-opacity select-none touch-none pointer-events-none whitespace-nowrap -translate-x-1/2 bg-fg text-bg px-1 py-0.5 text-[0.75em] font-medium inline-flex",
                  {
                    "opacity-100": descriptionVisible,
                    "opacity-0 delay-100": !descriptionVisible
                  }
                )}
                style={{ left: `${descriptionPosition}%` }}
              >
                {description}
              </div>
            </div>
          )}
        </div>
      </form>
    </>
  )
}

export default RangeSlider
