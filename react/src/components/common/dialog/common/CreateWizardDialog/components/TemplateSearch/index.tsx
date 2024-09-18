import { formatLibraryObject } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/utilityFunctions'
import { PropsType as TemplateType } from '@cfComponents/cards/WorkflowCardDumb'
import Loader from '@cfComponents/UIPrimitives/Loader'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import { getTemplates } from '@XMLHTTP/API/workflow'
import Fuse from 'fuse.js'
import { ChangeEvent, useState } from 'react'

import { TemplateThumbnail } from './styles'

type PropsType = {
  selected?: number
  templates: TemplateType[]
  onTemplateSelect: (id: number) => void
  setTemplateData: (projectData: TemplateType[]) => void
  templateType: string
}

type StateType = TemplateType[]

const TemplateSearch = ({
  selected,
  templates,
  onTemplateSelect,
  setTemplateData,
  templateType
}: PropsType) => {
  const [results, setResults] = useState<StateType>(templates)

  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    const fuse = new Fuse(templates, {
      keys: ['title', 'description']
    })
    const value = e.target.value
    if (value === '') {
      setResults(templates)
      return
    }

    const filtered: StateType = fuse.search(value).map((result) => result.item)
    setResults(filtered)
  }

  if (templates === null) {
    getTemplates(templateType, (responseData) => {
      const projectData = responseData.dataPackage.map((project) => {
        return formatLibraryObject(project)
      })
      setTemplateData(projectData)
      setResults(projectData)
    })
    return <Loader />
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
          {results.slice(0, 12).map((result) => (
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
