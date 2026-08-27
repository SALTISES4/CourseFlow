import { FocusEventHandler } from 'react'

import { StyledColorPicker } from './styles'

type PropsType = {
  size?: 'small' | 'medium'
  label?: string
  color: string
  onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
  onChange?: (color: string) => void
  disabled?: boolean
}

const ColorPicker = ({
  label = 'Color',
  size = 'medium',
  color,
  disabled,
  onBlur,
  onChange
}: PropsType) => (
  <StyledColorPicker
    label={label}
    size={size}
    value={color}
    format="hex"
    disabled={disabled}
    isAlphaHidden={true}
    onBlur={onBlur}
    onChange={onChange}
  />
)

export default ColorPicker
