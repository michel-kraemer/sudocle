import * as RadixRadioGroup from "@radix-ui/react-radio-group"
import { ReactNode } from "react"

interface Option {
  id: string
  label: ReactNode
}

interface RadioGroupProps {
  name: string
  ariaLabel: string
  value: string
  options: Option[]
  onChange: (id: string) => void
}

const RadioGroup = ({
  name,
  ariaLabel,
  value,
  options,
  onChange
}: RadioGroupProps) => {
  return (
    <form>
      <RadixRadioGroup.Root
        className="flex flex-col"
        value={value}
        aria-label={ariaLabel}
        onValueChange={onChange}
      >
        {options.map(o => (
          <div className="flex items-start relative leading-4" key={o.id}>
            <div className="h-4 flex items-center">
              <RadixRadioGroup.Item
                className="cursor-default w-[1em] h-[1em] border border-fg/50 rounded mr-1 data-[state=checked]:border-primary data-[state=checked]:border-[0.2rem] transition-colors"
                id={`${name}-${o.id}`}
                value={o.id}
              />
            </div>
            <label htmlFor={`${name}-${o.id}`}>{o.label}</label>
          </div>
        ))}
      </RadixRadioGroup.Root>
    </form>
  )
}

export default RadioGroup
