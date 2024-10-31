import {
  FilterOption,
  SearchFilterOption,
  SortOption
} from '@cfComponents/filters/types'
import Button from '@mui/material/Button'
import { produce } from 'immer'
import {MouseEventHandler, ReactNode, useEffect, useState} from 'react'

import { StyledMenu, StyledMenuItem } from './styles'

type NonSortableProps = {
  onChange: (value: SearchFilterOption) => void
}

type PropsType = {
  icon: ReactNode
  placeholder?: string
  options: SearchFilterOption[]
} & NonSortableProps

type StateType = SearchFilterOption

const FilterButton = ({
  icon,
  placeholder = 'Filter',
  options,
  onChange
}: PropsType) => {
  const enabled = options.find((o) => o.enabled)
  const [el, setEl] = useState<StateType>({
    label: placeholder,
    value: enabled?.value ?? null
  })
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    setMenuAnchor(event.currentTarget)
  }

    useEffect(() => {
//    console.log('rendering')

  }, [onChange, enabled, el ])


  const onOptionClick = (option: SearchFilterOption) => {
    setEl(option)
    onChange(option)
    setMenuAnchor(null)
  }

  return (
    <>
      <Button
        variant={menuAnchor ? 'contained' : 'outlined'}
        startIcon={icon}
        onClick={onButtonClick}
      >
        {el ? el.label : placeholder}
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
            selected={option.value === el.value}
          >
            {option.label}
          </StyledMenuItem>
        ))}
      </StyledMenu>
    </>
  )
}

export default FilterButton
