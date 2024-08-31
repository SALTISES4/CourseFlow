import { MouseEventHandler, ReactNode, useState } from 'react'
import { produce } from 'immer'
import Button from '@mui/material/Button'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { StyledMenu, StyledMenuItem } from './styles'
import {
  FilterOption,
  SortDirection,
  SortOption
} from '@cfCommonComponents/filters/types'

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
  options: FilterOption[] | SortOption[]
} & (SortableProps | NonSortableProps)

type StateType = {
  filter: FilterOption | SortOption | null
  value: SortDirection
}

const FilterButton = ({
  icon,
  sortable = false,
  placeholder = 'Filter',
  options,
  onChange
}: PropsType) => {
  const enabled = options.find((o) => o.enabled)
  const [el, setEl] = useState<StateType>({
    filter: enabled ?? null,
    value: SortDirection.DESC
  })
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const onOptionClick = (option: FilterOption) => {
    setEl(
      produce((draft) => {
        if (draft.filter?.name === option.name) {
          if (sortable) {
            draft.value =
              draft.value === SortDirection.ASC
                ? SortDirection.DESC
                : SortDirection.ASC
          }
        } else {
          draft.filter = option
          draft.value = SortDirection.DESC
        }

        onChange(draft.filter.name, draft.value)
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
        {el.filter ? el.filter?.label : placeholder}
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
            selected={option.name === el.filter?.name}
          >
            {option.label}
            {sortable && option.name === el.filter?.name && (
              <>
                {el.value === SortDirection.ASC && (
                  <ArrowUpwardIcon fontSize="small" />
                )}
                {el.value === SortDirection.DESC && (
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
