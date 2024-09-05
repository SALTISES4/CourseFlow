import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import Fuse from 'fuse.js'
import { ChangeEvent, useState } from 'react'

import { TemplateThumbnail } from './styles'
import { TemplateType } from './types'

type PropsType = {
  selected?: number
  templates: TemplateType[]
  onTemplateSelect: (id: number) => void
}

type StateType = TemplateType[]

const TemplateSearch = ({
  selected,
  templates,
  onTemplateSelect
}: PropsType) => {
  const [results, setResults] = useState<StateType>(templates)
  const fuse = new Fuse(templates, {
    keys: ['title', 'description']
  })

  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (value === '') {
      setResults(templates)
      return
    }

    const filtered: StateType = fuse.search(value).map((result) => result.item)
    setResults(filtered)
  }

  return (
    <Box>
      <TextField
        variant="standard"
        label="Search"
        fullWidth
        onChange={debounce(onSearchChange, 400)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />
      <Box sx={{ mt: 4 }}>
        <List>
          {results.slice(0, 6).map((result) => (
            <TemplateThumbnail
              key={result.id}
              selected={result.id === selected}
              onClick={() => onTemplateSelect(result.id)}
            >
              <ListItemText
                primary={result.title}
                secondary={result.description}
              />
            </TemplateThumbnail>
          ))}
        </List>
      </Box>
    </Box>
  )
}

export default TemplateSearch
