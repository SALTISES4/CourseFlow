import {
  LibraryContentTypeIn,
  LibrarySortDirectionIn,
  LibrarySortValueIn,
  WorkflowTypeIn
} from '@cf/api/gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { formatLibraryObject } from '@cf/utility/marshalling/libraryCards'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import { WorkflowTemplateSelection } from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap } from '@cfMUI/helper'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { debounce } from '@mui/material/utils'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type PropsType = {
  selected?: WorkflowTemplateSelection
  workflowType: WorkflowTypeIn
  onTemplateSelect: (template?: WorkflowTemplateSelection) => void
}

const TemplateSearch = ({
  selected,
  workflowType,
  onTemplateSelect
}: PropsType) => {
  const { t } = useTranslation('library')
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

  const visibleItems = useMemo(() => {
    const items = data?.items ?? []
    const normalizedKeyword = keyword.trim().toLocaleLowerCase()
    const shouldPin =
      selected &&
      (!normalizedKeyword ||
        selected.title.toLocaleLowerCase().includes(normalizedKeyword))

    if (!shouldPin) {
      return items.slice(0, 4)
    }

    return [
      selected.item,
      ...items.filter((item) => item.uuid !== selected.uuid)
    ].slice(0, 4)
  }, [data?.items, keyword, selected])

  const workflowData = useMemo(
    () => visibleItems.map((workflow) => formatLibraryObject(workflow, t)),
    [t, visibleItems]
  )

  useEffect(() => {
    if (
      data &&
      !isLoading &&
      selected &&
      !visibleItems.some((workflow) => workflow.uuid === selected.uuid)
    ) {
      onTemplateSelect(undefined)
    }
  }, [data, isLoading, onTemplateSelect, selected, visibleItems])

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
        label={t('filters.search')}
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
            {t('results.none')}
          </Typography>
        )}
        {workflowData.map((workflow, index) => (
          <WorkflowCardWrapper
            key={workflow.uuid}
            {...workflow}
            isSelected={workflow.uuid === selected?.uuid}
            onClick={() =>
              onTemplateSelect({
                uuid: workflow.uuid,
                title: String(workflow.title),
                item: visibleItems[index]
              })
            }
          />
        ))}
      </GridWrap>
    </Box>
  )
}

export default TemplateSearch
