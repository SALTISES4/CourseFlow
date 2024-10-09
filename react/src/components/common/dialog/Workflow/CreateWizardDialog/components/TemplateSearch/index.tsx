import { GridWrap } from '@cf/mui/helper'
import { formatLibraryObject } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/utilityFunctions'
import WorkflowCardDumb from '@cfComponents/cards/WorkflowCardDumb'
import Loader from '@cfComponents/UIPrimitives/Loader'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import { useLibraryObjectsSearchQuery } from '@XMLHTTP/API/library.rtk'
import { ChangeEvent } from 'react'

type PropsType = {
  selected?: number
  onTemplateSelect: (id: number) => void
}

const TemplateSearch = ({ selected, onTemplateSelect }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  // todo search as workflow, by type and as template
  const { data, isLoading } = useLibraryObjectsSearchQuery({})

  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {}

  if (!data || isLoading) return <Loader />

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
