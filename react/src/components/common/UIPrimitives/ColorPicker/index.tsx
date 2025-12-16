import { FocusEventHandler } from 'react'

import { StyledColorPicker } from './styles'

type PropsType = {
  size?: 'small' | 'medium'
  label?: string
  color: string
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
  onChange?: (color: string) => void
}

const ColorPicker = ({
  label = 'Color',
  size = 'medium',
  color,
  onBlur,
  onChange
}: PropsType) => (
  <StyledColorPicker
    label={label}
    size={size}
    value={color}
    format="hex"
    isAlphaHidden={true}
    onBlur={onBlur}
    onChange={onChange}
  />
)

export default ColorPicker
