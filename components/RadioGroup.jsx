import styles from "./RadioGroup.scss"

const RadioGroup = ({ name, value, options, onChange }) => {
  function onChangeInternal(event) {
    if (onChange) {
      onChange(event.target.id)
    }
  }

  return (<div className="radio-group">
    {options.map(o => <div className="item" key={o.id}>
      <input className="input" type="radio" name={name} id={o.id}
        checked={o.id === value} onChange={onChangeInternal} />
      <label className="label" htmlFor={o.id}>
        {o.label}
      </label>
    </div>)}
    <style jsx>{styles}</style>
  </div>)
}

export default RadioGroup
