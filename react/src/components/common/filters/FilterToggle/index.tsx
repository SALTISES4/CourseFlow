import FilterIcon from '@mui/icons-material/FilterAlt'
import { ReactNode, useState } from 'react'

import { StyledButton } from './styles'

export type PropsType = {
  className?: string
  icon?: ReactNode
  color?: 'template' | 'secondary'
  checked?: boolean
  onChange?: (val: boolean) => void
  label: string
}

const FilterToggle = ({
  checked = false,
  color = 'secondary',
  className,
  icon,
  label,
  onChange
}: PropsType) => {
  const [state, setState] = useState(checked ?? false)

  return (
    <StyledButton
      className={className}
      color={color}
      startIcon={icon ?? <FilterIcon />}
      variant={state ? 'contained' : 'outlined'}
      onClick={() => {
        const newVal = !state
        setState(newVal)
        onChange?.(newVal)
      }}
    >
      {label}
    </StyledButton>
  )
}

export default FilterToggle
