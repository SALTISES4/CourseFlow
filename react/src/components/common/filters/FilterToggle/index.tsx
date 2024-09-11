import FilterIcon from '@mui/icons-material/FilterAlt'
import Button from '@mui/material/Button'
import { ReactNode, useState } from 'react'

type PropsType = {
  icon?: ReactNode
  checked?: boolean
  onChange?: (val: boolean) => void
  label: ReactNode
}

const FilterToggle = ({
  checked = false,
  icon,
  label,
  onChange
}: PropsType) => {
  const [state, setState] = useState(checked ?? false)

  return (
    <Button
      color="template"
      startIcon={icon ?? <FilterIcon />}
      variant={state ? 'contained' : 'outlined'}
      onClick={() => {
        const newVal = !state
        setState(newVal)
        onChange && onChange(newVal)
      }}
    >
      {label}
    </Button>
  )
}

export default FilterToggle
