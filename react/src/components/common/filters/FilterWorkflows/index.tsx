import CancelIcon from '@mui/icons-material/Cancel'
import SearchIcon from '@mui/icons-material/Search'
import IconButton from '@mui/material/IconButton'
import Input from '@mui/material/Input'
import InputAdornment from '@mui/material/InputAdornment'
import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react'

import { Wrap } from './styles'

export type PropsType = {
  onPropagateChange: (keyword: string) => void
  placeholder?: string
}

const FilterWorkflows = ({
  placeholder = 'Search in projects...',
  onPropagateChange
}: PropsType) => {
  const [term, setTerm] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const onSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value)
  }

  /*******************************************************
   * LISTENERS / FUNCTIONS
   *******************************************************/

  const onInputKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onPropagateChange(term)
    }
  }

  const onClearClick = () => {
    setTerm('')
    onPropagateChange('')
    inputRef.current?.focus()
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <Wrap>
      <Input
        placeholder={placeholder}
        value={term}
        onChange={onSearchTermChange}
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
    </Wrap>
  )
}

export default FilterWorkflows
