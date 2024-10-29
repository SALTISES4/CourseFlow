import React from 'react'

type PropsType = {
  checked: boolean
  toggleAction: () => void
}

const Slider: React.FC<PropsType> = ({ checked, toggleAction }) => {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={toggleAction} // No need to bind in functional components
      />
      <span className="slider round" />
    </label>
  )
}

export default Slider
