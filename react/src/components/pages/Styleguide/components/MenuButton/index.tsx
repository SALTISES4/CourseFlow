import { MouseEventHandler, ReactNode, useState } from 'react'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { StyledButton, StyledMenu } from './styles'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

export type MenuButtonOption = {
  name: string | 'mui-divider'
  label?: string
  onClick?: () => void
  selected?: boolean
}

type PropsType = {
  icon?: ReactNode
  placeholder?: string
  menuAlign?: 'left' | 'right'
  disabled?: boolean
  selected?: string
  options: MenuButtonOption[]
  onChange: (value: string) => void
}

type StateType = MenuButtonOption | null

const MenuButton = ({
  icon,
  disabled,
  menuAlign = 'right',
  placeholder = 'Filter',
  options,
  selected,
  onChange
}: PropsType) => {
  const selectedOption = options.find((o) =>
    selected ? o.name === selected : o.selected
  )
  const [value, setValue] = useState<StateType>(selectedOption ?? null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const onOptionClick = (option: MenuButtonOption) => {
    if (option.name !== value?.name) {
      // if option click has a custom callback action, we don't set the value
      if (option.onClick) {
        option.onClick()
      } else {
        setValue(option)
        onChange(option.name)
      }
    }
    setMenuAnchor(null)
  }

  return (
    <>
      <StyledButton
        disabled={disabled}
        variant="outlined"
        endIcon={disabled ? null : icon ?? <KeyboardArrowDownIcon />}
        onClick={onButtonClick}
        menuActive={!!menuAnchor}
      >
        {value ? value.label : placeholder}
      </StyledButton>

      {!disabled && (
        <StyledMenu
          anchorEl={menuAnchor}
          keepMounted
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: menuAlign
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: menuAlign
          }}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
        >
          {options.map((option) => {
            if (option.name === 'mui-divider') {
              return <Divider key={option.name} component="li" />
            }

            const isSelected = value
              ? 'name' in value && option.name === value.name
              : false

            return (
              <MenuItem
                key={option.name}
                onClick={() => onOptionClick(option)}
                selected={isSelected}
              >
                {option.label}
              </MenuItem>
            )
          })}
        </StyledMenu>
      )}
    </>
  )
}

export default MenuButton
