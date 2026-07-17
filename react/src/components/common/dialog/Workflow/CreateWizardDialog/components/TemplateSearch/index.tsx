import {
  LibraryContentTypeIn,
  LibrarySortDirectionIn,
  LibrarySortValueIn,
  WorkflowTypeIn
} from '@cf/api/gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { formatLibraryObject } from '@cf/utility/marshalling/libraryCards'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap } from '@cfMUI/helper'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { debounce } from '@mui/material/utils'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'

type PropsType = {
  selected?: string
  workflowType: WorkflowTypeIn
  onTemplateSelect: (template?: { uuid: string; title: string }) => void
}

const TemplateSearch = ({
  selected,
  workflowType,
  onTemplateSelect
}: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const [keyword, setKeyword] = useState('')
  const { data, isLoading } = useLibrarySearch({
    pagination: { page: 0, resultsPerPage: 4 },
    sort: {
      value: LibrarySortValueIn.DATE_CREATED,
      direction: LibrarySortDirectionIn.DESC
    },
    filters: {
      contentType: LibraryContentTypeIn.WORKFLOW,
      isTemplate: true,
      isArchived: false,
      workflowTypes: [workflowType],
      keyword
    }
  })

  function onSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setKeyword(e.target.value)
  }

  const workflowData = useMemo(
    () =>
      (data?.items ?? []).map((workflow) => {
        return formatLibraryObject(workflow)
      }),
    [data?.items]
  )

  useEffect(() => {
    if (
      data &&
      !isLoading &&
      selected &&
      !workflowData.some((workflow) => workflow.uuid === selected)
    ) {
      onTemplateSelect(undefined)
    }
  }, [data, isLoading, onTemplateSelect, selected, workflowData])

  if (!data || isLoading) {
    return <Loader />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <Box data-test-id="workflow-template-search-view">
      <TextField
        variant="standard"
        label="Search"
        fullWidth
        onChange={debounce(onSearchChange, 400)}
        inputProps={{ 'data-test-id': 'workflow-template-search-field' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />
      <GridWrap sx={{ mt: 4 }} data-test-id="workflow-template-search-results">
        {!workflowData.length && (
          <Typography data-test-id="workflow-template-search-empty-state">
            No results found
          </Typography>
        )}
        {workflowData.map((workflow) => (
          <WorkflowCardWrapper
            key={workflow.uuid}
            {...workflow}
            isSelected={workflow.uuid === selected}
            onClick={() =>
              onTemplateSelect({
                uuid: workflow.uuid,
                title: String(workflow.title)
              })
            }
          />
        ))}
      </GridWrap>
    </Box>
  )
}

export default TemplateSearch
