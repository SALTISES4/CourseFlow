import { ChangeEvent, useState } from 'react'
import Fuse from 'fuse.js'
import { debounce } from '@mui/material/utils'
import { GridWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import WorkflowCardDumb from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardDumb'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import { ProjectType } from './types'

type PropsType = {
  selected?: number
  projects: ProjectType[]
  onProjectSelect: (id: number) => void
}

type StateType = ProjectType[]

const ProjectSearch = ({ selected, projects, onProjectSelect }: PropsType) => {
  const [results, setResults] = useState<StateType>(projects)
  const fuse = new Fuse(projects, {
    keys: ['title', 'caption']
  })

  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (value === '') {
      setResults(projects)
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
      <GridWrap sx={{ mt: 4 }}>
        {results.slice(0, 4).map((project, index) => (
          <WorkflowCardDumb
            key={index}
            {...project}
            isSelected={project.isSelected || project.id === selected}
            onClick={() => onProjectSelect(project.id)}
          />
        ))}
      </GridWrap>
    </Box>
  )
}

export default ProjectSearch
