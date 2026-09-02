import { SearchFilterOption } from '@cfComponents/filters/types'
import FilterIcon from '@mui/icons-material/FilterAlt'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import {
  ChangeEvent,
  MouseEventHandler,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useTranslation } from 'react-i18next'

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
  showSearch?: boolean
  selected?: string
  options: FilterMultiselectOption[]
  onChange: (values: SearchFilterOption[]) => void
}

const FilterMultiselect = ({
  icon,
  disabled,
  menuAlign = 'left',
  placeholder,
  searchPlaceholder,
  showSearch = true,
  options,
  selected,
  onChange
}: PropsType) => {
  const { t } = useTranslation('common')
  const resolvedPlaceholder = placeholder ?? t('labels.filter')
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('labels.find')
  const preselected = options.filter((o) =>
    selected ? o.value === selected : o.selected
  )
  const [value, setValue] = useState(preselected)
  const [search, setSearch] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)
  const onChangeRef = useRef(onChange)

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
    const visibleValues = new Set(filteredOptions.map((option) => option.value))
    const selectableVisibleOptions = filteredOptions.filter(
      (option) => !option.disabled
    )
    const allSelectableVisibleOptionsAreSelected =
      selectableVisibleOptions.length > 0 &&
      selectableVisibleOptions.every((option) =>
        value.some((selectedOption) => selectedOption.value === option.value)
      )

    if (!allSelectableVisibleOptionsAreSelected) {
      setValue([
        ...value.filter((option) => !visibleValues.has(option.value)),
        ...selectableVisibleOptions
      ])
    }
  }, [value, filteredOptions])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onChangeRef.current(value)
  }, [value])

  useEffect(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    setFilteredOptions(
      normalizedSearch
        ? options.filter((option) =>
            option.label.toLocaleLowerCase().includes(normalizedSearch)
          )
        : options
    )
  }, [search, options])

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
        {resolvedPlaceholder}
        {!!value.length && <StyledCounter>{value.length}</StyledCounter>}
      </StyledButton>

      {!disabled && (
        <StyledPopover
          open={!!menuAnchor}
          anchorEl={menuAnchor}
          onClose={onClose}
          TransitionProps={{ onExited: resetState }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: menuAlign
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: menuAlign
          }}
        >
          {showSearch && (
            <StyledSearch>
              <TextField
                fullWidth
                name="search"
                variant="standard"
                label={resolvedSearchPlaceholder}
                value={search}
                onChange={onSearchChange}
              />
            </StyledSearch>
          )}
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
            <Button onClick={onSelectNone}>{t('labels.none')}</Button>
            <Button onClick={onSelectAll}>{t('labels.all')}</Button>
          </StyledActions>
        </StyledPopover>
      )}
    </>
  )
}

export default FilterMultiselect
