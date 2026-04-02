import { LibrarySortDirectionIn, LibrarySortValueIn } from '@cf/api/gen'
import useMount from '@cf/hooks/useMount'
import { SortOption } from '@cfComponents/filters/types'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import Button from '@mui/material/Button'
import { produce } from 'immer'
import { MouseEvent, ReactNode, useState } from 'react'

import { StyledMenu, StyledMenuItem } from './styles'

type SortableProps = {
  onChange: (
    value: LibrarySortValueIn,
    direction: LibrarySortDirectionIn
  ) => void
}

type PropsType = {
  icon: ReactNode
  placeholder?: string
  options: SortOption[]
} & SortableProps

type StateType = SortOption

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
  placeholder = 'Sort',
  options,
  onChange
}: PropsType) => {
  const enabledOption = options.find((o) => o.enabled)

  useMount()

  const [enabledEl, setEnabledEl] = useState<StateType>({
    label: placeholder,
    value: enabledOption?.value ?? null,
    direction: LibrarySortDirectionIn.DESC
  })

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
    const updatedEl = produce(enabledEl, (draft) => {
      draft.value = option.value
      draft.label = option.label
      draft.direction = toggleSortDirection(draft.direction)
    })

    setEnabledEl(updatedEl)
    onChange(updatedEl.value, updatedEl.direction)
  }

  /*******************************************************
   * RENDER COMPONENTS
   *******************************************************/
  return (
    <>
      <Button
        variant={menuAnchor ? 'contained' : 'outlined'}
        startIcon={icon}
        onClick={onButtonClick}
      >
        {enabledEl?.label ?? placeholder}
      </Button>

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
            selected={option.value === enabledEl.value}
          >
            {option.label}
            {option.value === enabledEl.value && (
              <>
                {enabledEl.direction === LibrarySortDirectionIn.ASC && (
                  <ArrowUpwardIcon fontSize="small" />
                )}
                {enabledEl.direction === LibrarySortDirectionIn.DESC && (
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
