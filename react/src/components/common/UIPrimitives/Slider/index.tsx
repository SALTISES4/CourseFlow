import Slider from '@mui/material/Slider'
import React from 'react'

type PropsType = {
  value: boolean
  handleChange: () => void
}

const BinarySlider = ({ value, handleChange }: PropsType) => {
  return (
    <Slider
      value={Number(value)}
      min={0}
      max={1}
      step={1}
      track="normal"
      valueLabelDisplay="off"
      onChange={handleChange}
    />
  )
}

export default BinarySlider
