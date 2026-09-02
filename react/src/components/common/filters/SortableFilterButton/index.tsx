import { LibrarySortDirectionIn, LibrarySortValueIn } from '@cf/api/gen'
import { SortOption } from '@cfComponents/filters/types'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { MouseEvent, MouseEventHandler, ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledMenu, StyledMenuItem } from './styles'

type SortableProps = {
  onChange: (
    value: LibrarySortValueIn,
    direction: LibrarySortDirectionIn
  ) => void
  onReset: MouseEventHandler<HTMLButtonElement>
}

type PropsType = {
  icon: ReactNode
  placeholder?: string
  options: SortOption[]
} & SortableProps

function toggleSortDirection(
  dir: LibrarySortDirectionIn | null
): LibrarySortDirectionIn {
  if (!dir || dir === LibrarySortDirectionIn.ASC) {
    return LibrarySortDirectionIn.DESC
  }
  return LibrarySortDirectionIn.ASC
}

const SortableFilterButton = ({
  icon,
  placeholder,
  options,
  onChange,
  onReset
}: PropsType) => {
  const { t } = useTranslation('common')
  const enabledOption = options.find((o) => o.enabled)
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)

  /**
   * Opens the menu for the options
   */
  function onButtonClick(event: MouseEvent<HTMLButtonElement>) {
    setMenuAnchor(event.currentTarget)
  }

  /**
   * handles selecting an option
   */
  function onOptionClick(option: SortOption) {
    const direction =
      enabledOption?.value === option.value
        ? toggleSortDirection(enabledOption.direction ?? null)
        : LibrarySortDirectionIn.ASC
    onChange(option.value, direction)
    setMenuAnchor(null)
  }

  /*******************************************************
   * RENDER COMPONENTS
   *******************************************************/
  return (
    <>
      <Box display="inline-flex" alignItems="center">
        <Button
          variant={menuAnchor ? 'contained' : 'outlined'}
          startIcon={icon}
          onClick={onButtonClick}
        >
          {enabledOption?.label ?? placeholder ?? t('labels.sort')}
          {enabledOption && (
            <IconButton
              color="primary"
              aria-label={t('labels.close')}
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
            selected={option.value === enabledOption?.value}
          >
            {option.label}
            {option.value === enabledOption?.value && (
              <>
                {enabledOption.direction === LibrarySortDirectionIn.ASC && (
                  <ArrowUpwardIcon fontSize="small" />
                )}
                {enabledOption.direction === LibrarySortDirectionIn.DESC && (
                  <ArrowDownwardIcon fontSize="small" />
                )}
              </>
            )}
          </StyledMenuItem>
        ))}
      </StyledMenu>
    </>
  )
}

export default SortableFilterButton
