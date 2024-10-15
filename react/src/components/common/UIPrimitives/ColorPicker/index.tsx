import { StyledColorPicker } from './styles'

type PropsType = {
  size?: 'small' | 'medium'
  label?: string
  color: string
  onChange?: (color: string) => void
}

const ColorPicker = ({
  label = 'Color',
  size = 'medium',
  color,
  onChange
}: PropsType) => (
  <StyledColorPicker
    label={label}
    size={size}
    value={color}
    format="hex"
    onChange={onChange}
  />
)

export default ColorPicker
