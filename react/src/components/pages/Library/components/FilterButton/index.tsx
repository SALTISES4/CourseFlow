import { MouseEventHandler, ReactNode, useState } from 'react'
import { produce } from 'immer'
import Button from '@mui/material/Button'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { StyledMenu, StyledMenuItem } from './styles'
import {FilterOption, SortDirection} from '@cfPages/Library/components/types'

type SortableProps = {
  sortable: true
  onChange: (value: string, direction: SortDirection) => void
}

type NonSortableProps = {
  sortable?: false
  onChange: (value: string) => void
}

type PropsType = {
  icon: ReactNode
  placeholder?: string
  options: FilterOption[]
} & (SortableProps | NonSortableProps)

type StateType = {
  filter: FilterOption | null
  direction: SortDirection
}

const FilterButton = ({
  icon,
  sortable = false,
  placeholder = 'Filter',
  options,
  onChange
}: PropsType) => {
  const selected = options.find((o) => o.selected)
  const [value, setValue] = useState<StateType>({
    filter: selected ?? null,
    direction: SortDirection.DESC
  })
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const onOptionClick = (option: FilterOption) => {
    setValue(
      produce((draft) => {
        if (draft.filter?.name === option.name) {
          if (sortable) {
            draft.direction =
              draft.direction === SortDirection.ASC
                ? SortDirection.DESC
                : SortDirection.ASC
          }
        } else {
          draft.filter = option
          draft.direction = SortDirection.DESC
        }

        onChange(draft.filter.name, draft.direction)
      })
    )

    if (!sortable) {
      setMenuAnchor(null)
    }
  }

  return (
    <>
      <Button
        variant={menuAnchor ? 'contained' : 'outlined'}
        startIcon={icon}
        onClick={onButtonClick}
      >
        {value.filter ? value.filter?.label : placeholder}
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
            key={option.name}
            onClick={() => onOptionClick(option)}
            selected={option.name === value.filter?.name}
          >
            {option.label}
            {sortable && option.name === value.filter?.name && (
              <>
                {value.direction === SortDirection.ASC && (
                  <ArrowUpwardIcon fontSize="small" />
                )}
                {value.direction === SortDirection.DESC && (
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

export default FilterButton
