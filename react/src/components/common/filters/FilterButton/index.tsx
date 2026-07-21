import { SearchFilterOption } from '@cfComponents/filters/types'
import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { MouseEventHandler, ReactNode, useState } from 'react'

import { StyledMenu, StyledMenuItem } from './styles'

type NonSortableProps = {
  onChange: (value: SearchFilterOption) => void
}

type PropsType = {
  icon: ReactNode
  placeholder?: string
  options: SearchFilterOption[]
} & NonSortableProps

const FilterButton = ({
  icon,
  placeholder = 'Filter',
  options,
  onChange
}: PropsType) => {
  const selectedOption = options.find(
    (option) => option.enabled && option.value !== null
  )
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const onOptionClick = (option: SearchFilterOption) => {
    onChange(option)
    setMenuAnchor(null)
  }

  const onReset = () => {
    const resetOption = options.find((option) => option.value === null) ?? {
      label: placeholder,
      value: null
    }
    onChange(resetOption)
    setMenuAnchor(null)
  }

  return (
    <>
      <Box display="inline-flex" alignItems="center">
        <Button
          variant={menuAnchor ? 'contained' : 'outlined'}
          startIcon={icon}
          onClick={onButtonClick}
        >
          {selectedOption?.label ?? placeholder}
        </Button>
        {selectedOption && (
          <IconButton aria-label="close" size="small" onClick={onReset}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <StyledMenu
        anchorEl={menuAnchor}
        id="more-menu"
        keepMounted
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
      >
        {options.map((option) => (
          <StyledMenuItem
            key={option.value}
            onClick={() => onOptionClick(option)}
            selected={option.value === (selectedOption?.value ?? null)}
          >
            {option.label}
          </StyledMenuItem>
        ))}
      </StyledMenu>
    </>
  )
}

export default FilterButton
