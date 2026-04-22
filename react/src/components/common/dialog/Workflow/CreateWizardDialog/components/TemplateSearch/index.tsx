import { formatLibraryObject } from '@cf/utility/marshalling/libraryCards'
import WorkflowCardDumb from '@cfComponents/cards/WorkflowCardDumb'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap } from '@cfMUI/helper'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import { ChangeEvent } from 'react'

type PropsType = {
  selected?: string
  onTemplateSelect: (id: string) => void
}

const TemplateSearch = ({ selected, onTemplateSelect }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  // todo search as workflow, by type and as template
  const { data, isLoading } = useLibraryObjectsSearchQuery({})

  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {}

  if (!data || isLoading) {
    return <Loader />
  }

  const workflowData = data.dataPackage.items.map((project) => {
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
        {workflowData.map((workflow, index) => (
          <WorkflowCardDumb
            key={workflow.id}
            {...workflow}
            isSelected={workflow.id === selected}
            onClick={() => onTemplateSelect(workflow.id)}
          />
        ))}
      </GridWrap>
    </Box>
  )
}

export default TemplateSearch
