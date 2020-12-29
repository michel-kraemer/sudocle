import styles from "./RadioGroup.scss"

const RadioGroup = ({ name, value, options, onChange }) => {
  function onChangeInternal(id) {
    if (onChange) {
      onChange(id)
    }
  }

  return (<div className="radio-group">
    {options.map(o => <div className="item" key={o.id}>
      <div className="input-container">
        <input className="input" type="radio" name={name} id={`${name}-${o.id}`}
          checked={o.id === value} onChange={() => onChangeInternal(o.id)} />
      </div>
      <label className="label" htmlFor={o.id}>
        {o.label}
      </label>
    </div>)}
    <style jsx>{styles}</style>
  </div>)
}

export default RadioGroup
