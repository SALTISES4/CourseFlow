import { ChangeEvent, useState } from 'react'
import Fuse from 'fuse.js'
import { debounce } from '@mui/material/utils'
import { GridWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import WorkflowCardDumb from '@cfComponents/cards/WorkflowCardDumb'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import { PropsType as ProjectType } from '@cfComponents/cards/WorkflowCardDumb'
import { getProjectsForCreate } from '@XMLHTTP/API/workflow'
import { formatLibraryObject } from '@cf/utility/marshalling/libraryCards'
import Loader from "@cfComponents/UIPrimitives/Loader";

type PropsType = {
  selected?: number
  projects: ProjectType[] | null
  onProjectSelect: (id: number) => void
  setProjectData: (project_data: ProjectType[]) => void
}

type StateType = ProjectType[]

const ProjectSearch = ({
  selected,
  projects,
  onProjectSelect,
  setProjectData
}: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const [results, setResults] = useState<StateType>([])

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    const fuse = new Fuse(projects, {
      keys: ['title', 'caption']
    })
    const value = e.target.value
    if (value === '') {
      setResults(projects)
      return
    }

    const filtered: StateType = fuse.search(value).map((result) => result.item)
    setResults(filtered)
  }

  if (projects === null) {
    getProjectsForCreate((response_data) => {
      const project_data = response_data.data_package.map((project) => {
        return formatLibraryObject(project)
      })
      setProjectData(project_data)
      setResults(project_data)
    })
    return <Loader />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
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
        {results.slice(0, 8).map((project, index) => (
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
