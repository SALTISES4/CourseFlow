import useMount from '@cf/hooks/useMount'
import { SortOption } from '@cfComponents/filters/types'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import Button from '@mui/material/Button'
import { produce } from 'immer'
import { MouseEvent, ReactNode, useEffect, useState } from 'react'

import { StyledMenu, StyledMenuItem } from './styles'

export enum SortValueOption {
  A_Z = 'A_Z',
  DATE_CREATED = 'DATE_CREATED',
  DATE_MODIFIED = 'DATE_MODIFIED'
}
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

type SortableProps = {
  onChange: (value: SortValueOption, direction: SortDirection) => void
}

type PropsType = {
  icon: ReactNode
  placeholder?: string
  options: SortOption[]
} & SortableProps

type StateType = SortOption

function toggleSortDirection(dir: SortDirection | null): SortDirection {
  if (!dir || dir === SortDirection.ASC) return SortDirection.DESC
  return SortDirection.ASC
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
    direction: SortDirection.DESC
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
                {enabledEl.direction === SortDirection.ASC && (
                  <ArrowUpwardIcon fontSize="small" />
                )}
                {enabledEl.direction === SortDirection.DESC && (
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
