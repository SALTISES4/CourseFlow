import { ChangeEvent, useState } from 'react'
import Fuse from 'fuse.js'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import { debounce } from '@mui/material/utils'
import {PrepareBackendDataForWorkflowCardDumb} from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardDumb'

import { TemplateThumbnail } from './styles'
import { PropsType as TemplateType } from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardDumb'
import { getTemplates} from '@XMLHTTP/API/workflow'
import WorkflowLoader from '@cfCommonComponents/UIComponents/WorkflowLoader'

type PropsType = {
  selected?: number
  templates: TemplateType[]
  onTemplateSelect: (id: number) => void
  setTemplateData: (project_data:TemplateType[])=>void,
  template_type: string
}

type StateType = TemplateType[]

const TemplateSearch = ({
  selected,
  templates,
  onTemplateSelect,
  setTemplateData,
  template_type,
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

  if(templates==null){
    getTemplates(template_type,(response_data)=>{
      const project_data = response_data.data_package.map(project=>{
        return PrepareBackendDataForWorkflowCardDumb(project)
      })
      setTemplateData(project_data)
      setResults(project_data)
    })
    return <WorkflowLoader/>
  }else{
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
}

export default TemplateSearch
