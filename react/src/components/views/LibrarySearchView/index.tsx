import useNavigateToLibraryItem from '@cf/hooks/useNavigateToLibraryItem'
import { GridWrap, OuterContentWrap } from '@cf/mui/helper'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/utilityFunctions'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import FilterButton from '@cfComponents/filters/FilterButton'
import FilterMultiselect from '@cfComponents/filters/FilterMultiselect'
import FilterToggle from '@cfComponents/filters/FilterToggle'
import FilterWorkflows from '@cfComponents/filters/FilterWorkflows'
import { SearchOption, SortDirection } from '@cfComponents/filters/types'
import Loader from '@cfComponents/UIPrimitives/Loader'
import Pagination from '@cfComponents/UIPrimitives/Pagination'
import FilterIcon from '@mui/icons-material/FilterAlt'
import SortIcon from '@mui/icons-material/Sort'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import { Link, Skeleton, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { LibraryObjectsSearchQueryArgs } from '@XMLHTTP/types/args'
import { LibraryObjectsSearchQueryResp } from '@XMLHTTP/types/query'
import { useEffect, useState } from 'react'
import { Dispatch, SetStateAction } from 'react'
import { Link as LinkRouter } from 'react-router-dom'

export type SearchOptionsState = {
  page: number
  sortOptions: SearchOption[]
  filterGroups: { [key: string]: SearchOption[] }
}

function updateFilterOptions(
  options: SearchOption[],
  currentSelection: { name: string; value?: SortDirection }
): SearchOption[] {
  return options.map((option) => {
    // Set 'selected' based on if the option's name matches the current selection's name
    const isSelected = option.name === currentSelection.name

    // Decide the 'direction' value: if the current selection has a direction and matches the name, use it, otherwise keep the original or set undefined
    let directionValue
    if (currentSelection.value && isSelected) {
      directionValue = currentSelection.value
    } else {
      directionValue = option.value
    }

    return {
      ...option,
      enabled: isSelected,
      value: isSelected ? directionValue : undefined
    }
  })
}

// @todo could use more work
function reduceStateToSearchArgs(
  stateParams: SearchOptionsState
): LibraryObjectsSearchQueryArgs {
  const activeFilters = stateParams.filterGroups.filterOptions.filter(
    (item) => item.enabled && item.value
  )
  if (stateParams.filterGroups.keyword[0].value !== '') {
    activeFilters.push(stateParams.filterGroups.keyword[0])
  }

  const activeSort = stateParams.sortOptions.find((item) => item.enabled)

  return {
    resultsPerPage: 10,
    page: 1,
    fullSearch: true,
    sort: activeSort,
    filters: activeFilters
  }
}

type PropsType = {
  data: LibraryObjectsSearchQueryResp
  defaultOptionsSearchOptions?: SearchOptionsState
  setSearchArgs: Dispatch<SetStateAction<LibraryObjectsSearchQueryArgs>>
  isLoading: boolean
  isError: boolean
}
/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibrarySearchView = ({
  data,
  defaultOptionsSearchOptions,
  setSearchArgs,
  isLoading,
  isError
}: PropsType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const navigateToItem = useNavigateToLibraryItem()
  // these are the UI filters, they represent the state of the UI grouping, separated into different sections
  const [searchParameters, setSearchParameters] = useState<SearchOptionsState>(
    defaultOptionsSearchOptions
  )

  useEffect(() => {
    if (!defaultOptionsSearchOptions) return
    const args = reduceStateToSearchArgs(searchParameters)
    // this are the formatted search args, reduced to only active filters, and formatted in a flat list for the API call
    // update to UI state, triggers an update to the search Args state, which in turn triggers useQuery
    // there is room for optimization / refactoring but do not recombine these states: UI filters are arbitrarily broken up and a presented in different ways
    // this grouping should not leak into the final API arguments calls
    setSearchArgs(args)
  }, [searchParameters, defaultOptionsSearchOptions])

  /*******************************************************
   * RENDER
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

    if (!data || isError) return <div>error</div>

    const cards = formatLibraryObjects(data.data_package.results)

    return (
      <>
        {!cards.length && <Typography>{_t('No results found')}</Typography>}

        {cards.map((item) => (
          <WorkflowCardWrapper key={`workflow_${item.id}`} {...item} />
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

  const FilterWorkflowResults = () => {
    if (isLoading) return <Loader />
    if (!data || isError) return <div>error</div>
    return (
      <FilterWorkflows
        workflows={formatLibraryObjects(data.data_package.results)} // @todo memoize
        // @todo need to handle key down (enter) which will trigger the main search results
        onChange={(workflow) => {
          const match = data.data_package.results.find(
            (el) => workflow.id === el.id
          )
          navigateToItem(match.id, match.type)
        }}
      />
    )
  }

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
              <FilterButton
                sortable
                options={searchParameters.sortOptions}
                icon={<SortIcon />}
                onChange={(val, dir) => {
                  const newFilterSortOptions = updateFilterOptions(
                    searchParameters.sortOptions,
                    { name: val, value: dir }
                  )
                  setSearchParameters({
                    ...searchParameters,
                    sortOptions: newFilterSortOptions
                  })
                }}
                placeholder="Sort"
              />

              <FilterButton
                options={searchParameters.filterGroups.filterOptions}
                icon={<FilterIcon />}
                onChange={(val) => {
                  const newFilterProjectOptions = updateFilterOptions(
                    searchParameters.filterGroups.filterOptions,
                    { name: val }
                  )
                  setSearchParameters({
                    ...searchParameters,
                    filterGroups: {
                      ...searchParameters.filterGroups,
                      filterOptions: newFilterProjectOptions
                    }
                  })
                }}
              />
              {searchParameters.filterGroups.disciplineOptions && (
                <FilterButton
                  options={searchParameters.filterGroups.disciplineOptions}
                  icon={<FilterIcon />}
                  onChange={(val) => {
                    const newFilterProjectOptions = updateFilterOptions(
                      searchParameters.filterGroups.disciplineOptions,
                      { name: val }
                    )
                    setSearchParameters({
                      ...searchParameters,
                      filterGroups: {
                        ...searchParameters.filterGroups,
                        filterOptions: newFilterProjectOptions
                      }
                    })
                  }}
                />
              )}
              {/* TODO: implement */}
              {searchParameters.filterGroups.disciplineOptions && (
                <FilterMultiselect
                  placeholder="Discipline"
                  searchPlaceholder="Find discipline"
                  options={searchParameters.filterGroups.disciplineOptions.map(
                    (o) => ({
                      value: o.name,
                      label: o.label
                    })
                  )}
                  onChange={(values) => console.log('changed to', values)}
                />
              )}
              {/* TODO: implement */}
              <FilterToggle
                label="Templates"
                icon={<SpaceDashboardOutlinedIcon />}
                onChange={(checked) => console.log('toggle is', checked)}
              />
            </Stack>
            <FilterWorkflowResults />
          </Stack>
        </Toolbar>
      )}

      <GridWrap>
        <Results />
      </GridWrap>

      {/* TODO: implement */}
      <Pagination
        current={1}
        pages={7}
        onChange={(page) => console.log('changed to page', page)}
      />
    </OuterContentWrap>
  )
}

export default LibrarySearchView
