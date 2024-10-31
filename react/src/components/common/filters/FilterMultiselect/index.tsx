import useMount from '@cf/hooks/useMount'
import useSkipFirstRender from '@cf/hooks/useSkipFirstRender'
import { SearchFilterOption } from '@cfComponents/filters/types'
import FilterIcon from '@mui/icons-material/FilterAlt'
import { debounce } from '@mui/material'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Fuse from 'fuse.js'
import { produce } from 'immer'
import {
  ChangeEvent,
  MouseEventHandler,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  StyledActions,
  StyledButton,
  StyledCounter,
  StyledMenu,
  StyledPopover,
  StyledSearch
} from './styles'

export type FilterMultiselectOption = {
  value: string | number
  label: string
  selected?: boolean
  disabled?: boolean
}

type PropsType = {
  icon?: ReactNode
  placeholder?: string
  searchPlaceholder?: string
  menuAlign?: 'left' | 'right'
  disabled?: boolean
  selected?: string
  options: FilterMultiselectOption[]
  onChange: (values: SearchFilterOption[]) => void
}

const FilterMultiselect = ({
  icon,
  disabled,
  menuAlign = 'left',
  placeholder = 'Filter',
  searchPlaceholder = 'Find',
  options,
  selected,
  onChange
}: PropsType) => {
  const preselected = options.filter((o) =>
    selected ? o.value === selected : o.selected
  )
  const [value, setValue] = useState(preselected)
  const [search, setSearch] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)
  const hasRendered = useSkipFirstRender()

  useMount()

  useEffect(() => {
    if (hasRendered) {
      onChange(value)
    }
  }, [value, options, filteredOptions])

  useEffect(() => {
    debouncedFilter(search)
  }, [search, options])

  const debouncedFilter = useMemo(() => {
    return debounce((term: string) => {
      if (!term.trim().length) {
        setFilteredOptions(options)
        return
      }

      const fuse = new Fuse(options, {
        keys: ['label']
      })

      const filtered: typeof options = fuse
        .search(term)
        .map((result) => result.item)

      console.log('filtered')
      console.log(filtered)
      setFilteredOptions(filtered)
    }, 500)
  }, [options])

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      setMenuAnchor(event.currentTarget)
    },
    []
  )

  const onOptionClick = useCallback(
    (option: FilterMultiselectOption) => {
      const index = value.findIndex((v) => v.value === option.value)

      setValue(
        produce((draft) => {
          if (index !== -1) {
            draft.splice(index, 1)
          } else {
            draft.push(option)
          }
        })
      )
    },
    [value]
  )

  const resetState = useCallback(() => {
    setSearch('')
  }, [])

  const onClose = useCallback(() => {
    setMenuAnchor(null)
  }, [])

  const onSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const onSelectNone = useCallback(() => {
    if (value.length) {
      setValue([])
    }
  }, [value])

  const onSelectAll = useCallback(() => {
    const filtered = filteredOptions.filter((o) => !o.disabled)
    if (value.length !== filtered.length) {
      setValue(filteredOptions.filter((o) => !o.disabled))
    }
  }, [value, filteredOptions])

  return (
    <>
      <StyledButton
        disabled={disabled}
        variant={value.length ? 'contained' : 'outlined'}
        startIcon={icon ?? <FilterIcon />}
        onClick={onButtonClick}
        menuActive={!!menuAnchor}
        hasValue={!!value.length}
      >
        {placeholder}
        {!!value.length && <StyledCounter>{value.length}</StyledCounter>}
      </StyledButton>

      {!disabled && (
        <StyledPopover
          open={!!menuAnchor}
          anchorEl={menuAnchor}
          onClose={onClose}
          TransitionProps={{
            onExited: resetState
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: menuAlign
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: menuAlign
          }}
        >
          <StyledSearch>
            <TextField
              fullWidth
              name="search"
              variant="standard"
              label={searchPlaceholder}
              value={search}
              onChange={onSearchChange}
            />
          </StyledSearch>
          <StyledMenu>
            {filteredOptions.map((option) => {
              const isSelected =
                value.findIndex((v) => v.value === option.value) !== -1

              return (
                <MenuItem
                  key={option.value}
                  onClick={() => onOptionClick(option)}
                  disabled={option.disabled}
                >
                  <Checkbox size="small" checked={isSelected} />
                  {option.label}
                </MenuItem>
              )
            })}
          </StyledMenu>
          <StyledActions>
            <Button onClick={onSelectNone}>None</Button>
            <Button onClick={onSelectAll}>All</Button>
          </StyledActions>
        </StyledPopover>
      )}
    </>
  )
}

export default FilterMultiselect
