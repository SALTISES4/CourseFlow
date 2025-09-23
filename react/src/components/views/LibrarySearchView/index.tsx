import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { GridWrap, OuterContentWrap } from '@cf/mui/helper'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/Utility.class'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import FilterButton from '@cfComponents/filters/FilterButton'
import FilterMultiselect from '@cfComponents/filters/FilterMultiselect'
import FilterToggle from '@cfComponents/filters/FilterToggle'
import FilterWorkflows from '@cfComponents/filters/FilterWorkflows'
import SortableFilterButton from '@cfComponents/filters/SortableFilterButton'
import { SearchFilterOption } from '@cfComponents/filters/types'
import Pagination from '@cfComponents/UIPrimitives/Pagination'
import LibraryHelper, {
  SearchOptions
} from '@cfViews/LibrarySearchView/LibraryHelper.Class'
import ErrorView from '@cfViews/MsgViews/ErrorView'
import NotFoundView from '@cfViews/MsgViews/NotFoundVIew'
import CategoryIcon from '@mui/icons-material/Category'
import FilterIcon from '@mui/icons-material/FilterAlt'
import SortIcon from '@mui/icons-material/Sort'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import { Link, Skeleton, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { getErrorMessage } from '@XMLHTTP/API/api'
import { useLibraryObjectsSearchQuery } from '@XMLHTTP/API/library.rtk'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import { produce } from 'immer'
import React, { useCallback, useEffect, useState } from 'react'
import { Link as LinkRouter } from 'react-router-dom'

type FilterGroups = {
  [key: string]: boolean
}

interface Config {
  pagination: boolean
  sortOptions: boolean
  filterGroups: FilterGroups
  keywordFilter: boolean
}

/*******************************************************
 * see:  https://docs.google.com/document/d/1LgSedmw-U6mDF8S48I3gMbaohfliZetki6AJAeIKKLw/edit?tab=t.0#heading=h.seafxrns9x1f
 *******************************************************/
type PropsType = {
  searchArgs: LibraryObjectsSearchQueryArgs
  setSearchArgs: (args: LibraryObjectsSearchQueryArgs) => void
  config: Config
  override?: {
    selectedId: number
    onCardSelect: (id: number) => void
  }
}

/*******************************************************
 * Input field
 * this one has been extracted from the main component becuase it has its own lifecycle and query
 * this separate query is a bad idea.
 * although passing in the state setter / getter from the parent probably undermines this
 *
 * It's an attempt to mimic
 * 'instant search' style UI (like Algolia)
 * but we don't really have that infrastructure in place
 *******************************************************/
const FilterWorkflowResults = ({
  setSearchFilterState
}: {
  setSearchFilterState: React.Dispatch<React.SetStateAction<SearchOptions>>
}) => {
  const navigateToItem = useNavigateToLibraryItem()
  const { data, error, isLoading, isError } = useLibraryObjectsSearchQuery({})

  if (isError) {
    return <div>error</div>
  }

  const res = data?.dataPackage?.items || []

  return (
    <FilterWorkflows
      workflows={formatLibraryObjects(res)} // @todo memoize
      // handle key down (enter) which will pass the 'keyword' filter string over to the external search
      onPropagateChange={(val) => {
        setSearchFilterState(
          produce((draft) => {
            draft.filterGroups.keywordFilter.value = val
            draft.pagination.page = 0
          })
        )
      }}
      onChange={(workflow) => {
        const match = data.dataPackage.items.find((el) => workflow.id === el.id)
        navigateToItem(match.id, match.type)
      }}
    />
  )
}

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibrarySearchView = ({
  searchArgs,
  setSearchArgs,
  config,
  override
}: PropsType) => {
  const defaultOptionsSearchOptions = LibraryHelper.defaultOptionsSearchOptions
  /*******************************************************
   * HOOKS
   *******************************************************/
  // these are the UI filters, they represent the state of the UI grouping, separated into different sections
  const [searchFilterState, setSearchFilterState] = useState<SearchOptions>(
    defaultOptionsSearchOptions
  )
  // discipline options are set in state since they may come from an asynchronous source
  const [disciplineOptions, setDisciplineOptions] = useState([])

  /*******************************************************
   * QUERY HOOKS
   *******************************************************/
  const { data, error, isLoading, isError, isFetching } =
    useLibraryObjectsSearchQuery(searchArgs)

  useEffect(() => {
    if (!defaultOptionsSearchOptions) {
      return
    }

    const args = LibraryHelper.reduceStateToSearchArgs(searchFilterState)

    /*******************************************************
     *    These are the formatted search args, reduced to only active filters, and formatted in a flat list for the API call
     *    update to UI state, triggers an update to the search Args state, which in turn triggers useQuery
     *    there is room for optimization / refactoring but do not recombine these states: UI filters are arbitrarily broken up and a presented in different ways
     *    this grouping should not leak into the final API arguments calls
     *******************************************************/
    setSearchArgs(args)
  }, [searchFilterState, defaultOptionsSearchOptions])

  useEffect(() => {
    const options = COURSEFLOW_APP.globalContextData.disciplines
    const mappedOptions: SearchFilterOption[] = options.map((o) => ({
      value: o.id,
      label: o.title
    }))
    setDisciplineOptions(mappedOptions)
  }, [COURSEFLOW_APP.globalContextData.disciplines])

  /*******************************************************
   * RENDER COMPONENTS
   *******************************************************/

  /*******************************************************
   *  SORTING
   *******************************************************/

  /**
   * This is a thin wrapper around SortableFilterButton, it's just used to clean up the main return statement
   * this is why it's a plain function returning JSX
   * searchParameters.sortOptions.options is passed in and sets initial state
   * but after that, SortableFilterButton manages its own state internally
   *
   * @todo we are having a problem with changes made to setSearchParameters
   * causing a re-render in parent (expected) which cause SortableFilterButton
   * to remount (not expected)
   * no amount of memoizing Sort or Sort's onChange seems to fix this
   * it signified we probably have a deeper state mgmt issue
   * however it seems to be fine for now
   **/

  const renderSort = () => {
    if (!config.sortOptions) {
      return <></>
    }

    return (
      <SortableFilterButton
        options={searchFilterState.sortOptions.options}
        icon={<SortIcon />}
        onChange={(val, dir) => {
          const newFilterSortOptions = LibraryHelper.updateSortOptions(
            searchFilterState.sortOptions.options,
            { value: val, direction: dir }
          )

          setSearchFilterState(
            produce((draft) => {
              draft.sortOptions.options = newFilterSortOptions
              draft.pagination.page = 0
            })
          )
        }}
        placeholder="Sort"
      />
    )
  }

  const renderRelationshipFilter = () => {
    if (!config.filterGroups.relationshipFilter) {
      return <></>
    }

    const filterGroup = searchFilterState.filterGroups.relationshipFilter
    const { options, name } = filterGroup

    return (
      <>
        {/*******************************************************
         *  RELATIONSHIP TO USER FILTER
         * owned
         * shared
         * archived etc
         *******************************************************/}
        <FilterButton
          options={options}
          icon={<FilterIcon />}
          onChange={(val) => {
            const newFilterProjectOptions = LibraryHelper.updateFilterOptions(
              options,
              val
            )
            setSearchFilterState(
              produce((draft) => {
                draft.filterGroups.relationshipFilter.options =
                  newFilterProjectOptions
                draft.pagination.page = 0
              })
            )
          }}
        />
      </>
    )
  }

  const renderWorkspaceTypeFilter = () => {
    if (!config.filterGroups.workspaceTypeFilter) {
      return <></>
    }

    const filterGroup = searchFilterState.filterGroups.workspaceTypeFilter

    const { options, name } = filterGroup

    return (
      <>
        {/*******************************************************
         *  Workspace Type
         * project
         * program
         * course
         * activity
         *******************************************************/}
        <FilterButton
          options={options}
          icon={<CategoryIcon />}
          onChange={(val) => {
            const newFilterProjectOptions = LibraryHelper.updateFilterOptions(
              options,
              val
            )
            setSearchFilterState(
              produce((draft) => {
                draft.filterGroups.workspaceTypeFilter.options =
                  newFilterProjectOptions
                draft.pagination.page = 0
              })
            )
          }}
        />
      </>
    )
  }

  /*******************************************************
   *  DisciplineFilter
   *******************************************************/
  const renderDisciplineFilter = useCallback(() => {
    if (!config.filterGroups.disciplineFilter) {
      return <></>
    }

    return (
      <>
        <FilterMultiselect
          placeholder="Discipline"
          searchPlaceholder="Find discipline"
          options={disciplineOptions}
          onChange={(values) => {
            const newFilterProjectOptions = LibraryHelper.updateFilterOptions(
              disciplineOptions,
              values
            )
            setSearchFilterState(
              produce((draft) => {
                draft.filterGroups.disciplineFilter.options =
                  newFilterProjectOptions
                draft.pagination.page = 0
              })
            )
          }}
        />
      </>
    )
  }, [disciplineOptions, searchFilterState])

  /*******************************************************
   *  IS TEMPLATE
   *******************************************************/
  const renderTemplateFilter = () => {
    if (!config.filterGroups.templateFilter) {
      return <></>
    }
    return (
      <>
        <FilterToggle
          label="Templates"
          icon={<SpaceDashboardOutlinedIcon />}
          onChange={(checked) =>
            setSearchFilterState(
              produce((draft) => {
                draft.filterGroups.templateFilter.value = !!checked || undefined
                draft.pagination.page = 0
              })
            )
          }
        />
      </>
    )
  }

  /*******************************************************
   *  Pagination
   *******************************************************/
  const renderPagination = () => {
    if (!config.pagination || !data || data.dataPackage.meta.pageCount <= 1) {
      return <></>
    }

    return (
      <Pagination
        current={data.dataPackage.meta.currentPage + 1}
        pages={data.dataPackage.meta.pageCount}
        onChange={(page) =>
          setSearchFilterState(
            produce((draft) => {
              draft.pagination.page = page
            })
          )
        }
      />
    )
  }

  /*******************************************************
   *  RESULTS
   *******************************************************/
  const Results = () => {
    if (isLoading) {
      return Array.from({ length: 10 }, (_, index) => (
        <Skeleton
          sx={{ height: '150px' }}
          variant={'rectangular'}
          key={index}
        />
      ))
    }

    if (!data) {
      return <NotFoundView />
    }
    if (isError) {
      return (
        <ErrorView message={`An error occurred: ${getErrorMessage(error)}`} />
      )
    }

    const cards = formatLibraryObjects(data.dataPackage.items)

    return (
      <>
        {!cards.length && <Typography>{_t('No results found')}</Typography>}

        {cards.map((item) => (
          <WorkflowCardWrapper
            key={`workflow_${item.id}`}
            {...item}
            isSelected={item.id === override?.selectedId}
            onClick={
              override ? () => override.onCardSelect(item.id) : undefined
            }
          />
        ))}

        {/* ALL VIEW NOT IMPLEMENTED YET */}
        {cards.length > 10 && (
          <Link component={LinkRouter} to={'$'}>
            <Typography>{_t('+ See all')}</Typography>
          </Link>
        )}
      </>
    )
  }

  /*******************************************************
   *  RENDER
   *******************************************************/
  return (
    <OuterContentWrap>
      {defaultOptionsSearchOptions && (
        <Toolbar disableGutters sx={{ mt: 4, mb: 4 }}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            sx={{ width: '100%' }}
          >
            <Stack direction="row" spacing={2}>
              {renderSort()}
              {renderRelationshipFilter()}
              {renderDisciplineFilter()}
              {renderWorkspaceTypeFilter()}
              {renderTemplateFilter()}
            </Stack>
            <FilterWorkflowResults
              setSearchFilterState={setSearchFilterState}
            />
          </Stack>
        </Toolbar>
      )}

      <GridWrap>
        <Results />
      </GridWrap>
      {renderPagination()}
    </OuterContentWrap>
  )
}

export default LibrarySearchView
