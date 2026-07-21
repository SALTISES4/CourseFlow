import {
  LibraryContentTypeIn,
  LibraryContentTypeOut,
  LibraryItemOut,
  LibrarySortDirectionIn,
  LibrarySortValueIn,
  ProjectPermission
} from '@cf/api/gen'
import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/Utility.class'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap } from '@cfMUI/helper'
import SearchIcon from '@mui/icons-material/Search'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'

const NO_ELIGIBLE_PROJECTS_TITLE =
  'You are not an owner or editor of any projects'
const NO_ELIGIBLE_PROJECTS_DESCRIPTION =
  'All workflows, whether they are programs, courses, or activities, exist within projects. You must always start by creating a project before proceeding to create any type of workflow. Currently you are not the owner and have not been added as an editor of any project.'

type PropsType = {
  selected?: string
  contextProjectUuid?: string | null
  onProjectSelect: (uuid?: string) => void
  panelTestId?: string
}

const WorkflowDestinationProjectSearch = ({
  selected,
  contextProjectUuid,
  onProjectSelect,
  panelTestId = 'workflow-project-search-view'
}: PropsType) => {
  const [keyword, setKeyword] = useState('')

  const baseSearch = useLibrarySearch({
    pagination: { page: 0, resultsPerPage: 4 },
    sort: {
      value: LibrarySortValueIn.DATE_MODIFIED,
      direction: LibrarySortDirectionIn.DESC
    },
    filters: {
      contentType: LibraryContentTypeIn.PROJECT,
      canCreateWorkflow: true,
      isArchived: false
    }
  })
  const search = useLibrarySearch({
    pagination: { page: 0, resultsPerPage: 4 },
    sort: {
      value: LibrarySortValueIn.DATE_MODIFIED,
      direction: LibrarySortDirectionIn.DESC
    },
    filters: {
      contentType: LibraryContentTypeIn.PROJECT,
      canCreateWorkflow: true,
      isArchived: false,
      ...(keyword.trim() ? { keyword: keyword.trim() } : {})
    }
  })
  const contextProject = useQuery({
    ...getProjectOptions({
      path: { uuid: contextProjectUuid ?? '' }
    }),
    enabled: Boolean(contextProjectUuid)
  })

  const pinnedProject = useMemo<LibraryItemOut | undefined>(() => {
    const project = contextProject.data?.item
    if (
      !project ||
      project.isArchived ||
      !project.permissions.actions.includes(ProjectPermission.CREATE_WORKFLOW)
    ) {
      return undefined
    }

    return {
      uuid: project.uuid,
      contentType: LibraryContentTypeOut.PROJECT,
      label: 'project',
      title: project.title,
      description: project.description,
      ownerName: null,
      workflowCount: null,
      dateCreated: project.dateCreated,
      modifiedOn: project.modifiedOn,
      isArchived: project.isArchived,
      isTemplate: project.isTemplate,
      isFavorite: project.isFavorite,
      projectUuid: null,
      projectIsArchived: null,
      permissions: project.permissions
    }
  }, [contextProject.data?.item])

  const visibleItems = useMemo(() => {
    const items = search.data?.items ?? []
    const normalizedKeyword = keyword.trim().toLocaleLowerCase()
    const shouldPin =
      pinnedProject &&
      (!normalizedKeyword ||
        pinnedProject.title.toLocaleLowerCase().includes(normalizedKeyword))

    if (!shouldPin) {
      return items.slice(0, 4)
    }

    return [
      pinnedProject,
      ...items.filter((item) => item.uuid !== pinnedProject.uuid)
    ].slice(0, 4)
  }, [keyword, pinnedProject, search.data?.items])

  useEffect(() => {
    if (search.isFetching) {
      return
    }

    if (selected && !visibleItems.some((item) => item.uuid === selected)) {
      onProjectSelect(undefined)
      return
    }

    if (!keyword.trim() && !selected && pinnedProject) {
      onProjectSelect(pinnedProject.uuid)
    }
  }, [
    keyword,
    onProjectSelect,
    pinnedProject,
    search.isFetching,
    selected,
    visibleItems
  ])

  if (baseSearch.isLoading || search.isLoading || contextProject.isLoading) {
    return <Loader />
  }

  if (baseSearch.isError || search.isError || contextProject.isError) {
    return <Alert severity="error">{_t('Unable to load projects')}</Alert>
  }

  if (baseSearch.data?.meta.totalResults === 0) {
    return (
      <Alert severity="warning" data-test-id="no-eligible-projects">
        <AlertTitle>{_t(NO_ELIGIBLE_PROJECTS_TITLE)}</AlertTitle>
        {_t(NO_ELIGIBLE_PROJECTS_DESCRIPTION)}
      </Alert>
    )
  }

  const cards = formatLibraryObjects(visibleItems)

  return (
    <Box data-test-id={panelTestId}>
      <TextField
        variant="standard"
        placeholder={_t('Search in projects...')}
        value={keyword}
        fullWidth
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setKeyword(event.target.value)
        }
        inputProps={{ 'data-test-id': 'workflow-project-search-field' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />
      <GridWrap data-test-id="library-results" sx={{ mt: 4 }}>
        {!cards.length && (
          <Typography data-test-id="workflow-project-search-empty-state">
            {_t('No results found')}
          </Typography>
        )}
        {cards.map((project) => (
          <WorkflowCardWrapper
            key={project.uuid}
            {...project}
            isSelected={project.uuid === selected}
            onClick={() => onProjectSelect(project.uuid)}
          />
        ))}
      </GridWrap>
    </Box>
  )
}

export default WorkflowDestinationProjectSearch
