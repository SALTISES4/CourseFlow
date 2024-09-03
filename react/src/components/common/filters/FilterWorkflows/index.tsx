import {
  KeyboardEvent,
  useState,
  useMemo,
  useRef,
  useEffect,
  ChangeEvent
} from 'react'
import Fuse from 'fuse.js'
import { debounce } from '@mui/material'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import CancelIcon from '@mui/icons-material/Cancel'
import IconButton from '@mui/material/IconButton'
import Input from '@mui/material/Input'
import {
  Wrap,
  StyledMenu,
  Suggestion,
  ProjectGroup,
  ProjectName,
  ProjectTag
} from './styles'
import { PropsType as ResultType } from '@cfComponents/cards/WorkflowCardDumb'
import { ELibraryObject } from '@XMLHTTP/types/entity'

// export type ResultType = {
//   id: string
//   group: string
//   name: string
//   chip: {
//     type: CHIP_TYPE
//     label: string
//   }
// }

export type PropsType = {
  workflows: ResultType[]
  onChange: (item: ResultType) => void
  placeholder?: string
  resultsLimit?: number
  seeAllText?: string
}

const FilterWorkflows = ({
  workflows,
  placeholder = 'Search in projects...',
  seeAllText = 'See all results',
  resultsLimit = 8,
  onChange
}: PropsType) => {
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState<ResultType>()
  const [results, setResults] = useState<ResultType[]>([])
  const [menuAnchor, setMenuAnchor] = useState<HTMLDivElement | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedFilter = useMemo(() => {
    return debounce((term) => {
      console.log(workflows)
      const fuse = new Fuse(workflows, {
        keys: ['title', 'description']
      })

      const filtered: typeof workflows = fuse
        .search(term)
        .map((result) => result.item)

      setResults(filtered.slice(0, resultsLimit))
    }, 500)
    // trust me bro - debounced + controlled inputs are yuck
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    debouncedFilter(term)
    // trust me bro - debounced + controlled inputs are yuck
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  useEffect(() => {
    setMenuAnchor(results.length > 0 ? wrapRef.current : null)
  }, [results])

  const onSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setTerm(value)

    if (value === '') {
      onMenuClose()
    }
  }

  // Manually control the suggestion list "selected" item
  const onInputKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      e.preventDefault()
    }

    const currentIndex = !selected
      ? -1
      : results.findIndex((p) => p.id === selected.id)

    switch (e.key) {
      case 'ArrowDown':
        if (!selected || currentIndex + 1 === results.length) {
          setSelected(results[0])
          break
        }
        setSelected(results[currentIndex + 1])
        break
      case 'ArrowUp':
        if (!selected || currentIndex - 1 === -1) {
          setSelected(results[results.length - 1])
          break
        }
        setSelected(results[currentIndex - 1])
        break
      case 'Enter':
        selected && onSuggestionClick(selected)
        break
      case 'Escape':
        onMenuClose()
        break
    }
  }

  const onInputFocus = () => {
    if (results.length) {
      setMenuAnchor(wrapRef.current)
    }
  }

  const onClearClick = () => {
    setTerm('')
    inputRef.current && inputRef.current.focus()
  }

  const onSuggestionClick = (p: ResultType) => {
    onChange(p)
    onMenuClose()
  }

  const onMenuClose = () => {
    setSelected(undefined)
    setMenuAnchor(null)
  }

  console.log(results)

  return (
    <Wrap ref={wrapRef}>
      <Input
        placeholder={placeholder}
        value={term}
        onChange={onSearchTermChange}
        onFocus={onInputFocus}
        onKeyDown={onInputKeydown}
        inputProps={{
          ref: inputRef
        }}
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        }
        endAdornment={
          term ? (
            <InputAdornment position="end">
              <IconButton color="primary" onClick={onClearClick}>
                <CancelIcon />
              </IconButton>
            </InputAdornment>
          ) : null
        }
      />

      <StyledMenu
        id="filter-projects-menu"
        disableAutoFocus
        disableAutoFocusItem
        disableRestoreFocus
        keepMounted
        autoFocus={false}
        anchorEl={menuAnchor}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        open={!!menuAnchor}
        onClose={onMenuClose}
      >
        {results.map((p) => (
          <Suggestion
            key={p.id}
            onClick={() => onSuggestionClick(p)}
            selected={selected && selected.id === p.id}
          >
            {/*<ProjectGroup>{p.group}</ProjectGroup>*/}
            <ProjectGroup>{p.description}</ProjectGroup>
            {/*<ProjectName>{p.name}</ProjectName>*/}
            <ProjectName>{p.title}</ProjectName>
            <ProjectTag>
              {/*<CardChip className={p.chip.type} label={p.chip.label} />*/}
            </ProjectTag>
          </Suggestion>
        ))}
        {results.length >= resultsLimit && (
          <MenuItem key="see-all">
            <Link href="#" underline="always">
              {seeAllText}
            </Link>
          </MenuItem>
        )}
      </StyledMenu>
    </Wrap>
  )
}

export default FilterWorkflows
