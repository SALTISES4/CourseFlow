import { SearchFilterOption } from '@cfComponents/filters/types'
import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { MouseEventHandler, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
  placeholder,
  options,
  onChange
}: PropsType) => {
  const { t } = useTranslation('common')
  const buttonPlaceholder = placeholder ?? t('labels.filter')
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

  const onReset: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const resetOption = options.find((option) => option.value === null) ?? {
      label: buttonPlaceholder,
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
          {selectedOption?.label ?? buttonPlaceholder}
          {selectedOption && (
            <IconButton
              color="primary"
              aria-label={t('actions.close')}
              size="small"
              onClick={onReset}
              style={{ margin: '-3px -8px -3px 8px' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Button>
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
