import { ReactNode } from "react"
import styles from "./RadioGroup.oscss"

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
    <div className="radio-group">
      {options.map(o => (
        <div className="item" key={o.id}>
          <div className="input-container">
            <input
              className="input"
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
      <style jsx>{styles}</style>
    </div>
  )
}

export default RadioGroup
