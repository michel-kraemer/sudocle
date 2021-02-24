import styles from "./Checkbox.scss"

const Checkbox = ({ name, label, value = false, onChange }) => {
  function onChangeInternal(e) {
    if (onChange) {
      onChange(e.target.checked)
    }
  }

  return (<div className="checkbox">
    <div className="input-container">
      <input className="input" type="checkbox" name={name} id={`${name}`}
        checked={value} onChange={e => onChangeInternal(e)} />
    </div>
    <label className="label" htmlFor={`${name}`}>
      {label}
    </label>
    <style jsx>{styles}</style>
  </div>)
}

export default Checkbox
