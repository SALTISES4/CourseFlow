import FilterIcon from '@mui/icons-material/FilterAlt'
import Button from '@mui/material/Button'
import { ReactNode, useState } from 'react'

export type PropsType = {
  icon?: ReactNode
  color?: 'template' | 'favorite' | 'secondary'
  checked?: boolean
  onChange?: (val: boolean) => void
  label: ReactNode
}

const FilterToggle = ({
  checked = false,
  color = 'secondary',
  icon,
  label,
  onChange
}: PropsType) => {
  const [state, setState] = useState(checked ?? false)

  return (
    <Button
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
    </Button>
  )
}

export default FilterToggle
