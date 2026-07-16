import { LibraryContentTypeIn } from '@cf/api/gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { formatLibraryObject } from '@cf/utility/marshalling/libraryCards'
import WorkflowCardDumb from '@cfComponents/cards/WorkflowCardDumb'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap } from '@cfMUI/helper'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import { ChangeEvent, useState } from 'react'

type PropsType = {
  selected?: string
  onTemplateSelect: (uuid: string) => void
}

const TemplateSearch = ({ selected, onTemplateSelect }: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const [keyword, setKeyword] = useState('')
  const { data, isLoading } = useLibrarySearch({
    filters: {
      contentType: LibraryContentTypeIn.WORKFLOW,
      isTemplate: true,
      isArchived: false,
      keyword
    }
  })

  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setKeyword(e.target.value)
  }

  if (!data || isLoading) {
    return <Loader />
  }

  const workflowData = data.items.map((workflow) => {
    return formatLibraryObject(workflow)
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
        {workflowData.map((workflow) => (
          <WorkflowCardDumb
            key={workflow.uuid}
            {...workflow}
            isSelected={workflow.uuid === selected}
            onClick={() => onTemplateSelect(workflow.uuid)}
          />
        ))}
      </GridWrap>
    </Box>
  )
}

export default TemplateSearch
