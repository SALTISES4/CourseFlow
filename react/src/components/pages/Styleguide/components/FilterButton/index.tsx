import { MouseEventHandler, ReactNode, useState } from 'react'
import { produce } from 'immer'
import Button from '@mui/material/Button'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { StyledMenu, StyledMenuItem } from './styles'

export type FilterOption = {
  name: string
  label: string
  selected?: boolean
}

type SortableProps = {
  sortable: true
  onChange: (value: string, direction: 'asc' | 'desc') => void
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
  direction: 'asc' | 'desc'
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
    direction: 'desc'
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
            draft.direction = draft.direction === 'asc' ? 'desc' : 'asc'
          }
        } else {
          draft.filter = option
          draft.direction = 'desc'
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
                {value.direction === 'asc' && (
                  <ArrowUpwardIcon fontSize="small" />
                )}
                {value.direction === 'desc' && (
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
