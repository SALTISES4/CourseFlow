import { GridWrap } from '@cf/mui/helper'
import { formatLibraryObject } from '@cf/utility/marshalling/libraryCards'
import WorkflowCardDumb from '@cfComponents/cards/WorkflowCardDumb'
import { PropsType as ProjectType } from '@cfComponents/cards/WorkflowCardDumb'
import Loader from '@cfComponents/UIPrimitives/Loader'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import { useListProjectsByCurrentUserQuery } from '@XMLHTTP/API/project.rtk'
import { ChangeEvent } from 'react'

type PropsType = {
  selected?: number
  onProjectSelect: (id: number) => void
}

const ProjectSearch = ({ selected, onProjectSelect }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  // candidate to move to another library search query
  const { data, isLoading } = useListProjectsByCurrentUserQuery({})

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    // const fuse = new Fuse(projects, {
    //   keys: ['title', 'caption']
    // })
    const value = e.target.value
    if (value === '') {
      // setResults(projects)
      return
    }
  }

  if (!data || isLoading) return <Loader />

  // @todo do to shape of legacy query, the objects are grouped by permission
  // (look at the query response shape)
  // this needs work
  const projectData = data.dataPackage.ownedProjects.map((project) => {
    return formatLibraryObject(project)
  })

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
        {projectData.map((project, index) => (
          <WorkflowCardDumb
            key={index}
            {...project}
            isSelected={project.id === selected}
            onClick={() => onProjectSelect(project.id)}
          />
        ))}
      </GridWrap>
    </Box>
  )
}

export default ProjectSearch
