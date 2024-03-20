import { ReactNode } from "react"

interface Option {
  id: string
  label: ReactNode
}

interface RadioGroupProps {
  name: string
  value: string
  options: Option[]
  onChange: (id: string) => void
}

const RadioGroup = ({ name, value, options, onChange }: RadioGroupProps) => {
  function onChangeInternal(id: string) {
    if (onChange) {
      onChange(id)
    }
  }

  return (
    <div className="flex flex-col">
      {options.map(o => (
        <div className="flex items-start relative leading-4" key={o.id}>
          <div className="h-4 flex items-center">
            <input
              className="appearance-none w-[1em] h-[1em] border border-fg/50 rounded mr-1 checked:border-primary checked:border-[0.2rem] transition-colors"
              type="radio"
              name={name}
              id={`${name}-${o.id}`}
              checked={o.id === value}
              onChange={() => onChangeInternal(o.id)}
            />
          </div>
          <label className="label" htmlFor={`${name}-${o.id}`}>
            {o.label}
          </label>
        </div>
      ))}
    </div>
  )
}

export default RadioGroup
