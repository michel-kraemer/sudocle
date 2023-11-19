import { ChangeEvent } from "react"
import styles from "./Checkbox.oscss"

interface CheckboxProps {
  name: string
  label: string
  value: boolean
  onChange: (checked: boolean) => void
}

const Checkbox = ({ name, label, value, onChange }: CheckboxProps) => {
  function onChangeInternal(e: ChangeEvent<HTMLInputElement>) {
    if (onChange) {
      onChange(e.target.checked)
    }
  }

  return (
    <div className="checkbox">
      <div className="input-container">
        <input
          className="input"
          type="checkbox"
          name={name}
          id={`${name}`}
          checked={value}
          onChange={e => onChangeInternal(e)}
        />
      </div>
      <label className="label" htmlFor={`${name}`}>
        {label}
      </label>
      <style jsx>{styles}</style>
    </div>
  )
}

export default Checkbox
