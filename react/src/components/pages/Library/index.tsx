import * as React from 'react'
import { LibraryObjectsSearchQueryResp } from '@XMLHTTP/types/query'
import { libraryObjectsSearchQuery, SearchArgs } from '@XMLHTTP/API/pages'
import { GridWrap, OuterContentWrap } from '@cfMUI/helper'
import { useQuery } from '@tanstack/react-query'
import Loader from '@cfCommonComponents/UIComponents/Loader'
import { generatePath, Link as LinkRouter, useNavigate } from 'react-router-dom'
import WorkflowCardDumb, {
  PropsType as WorkflowCardTypeUI
} from '@cfCommonComponents/cards/WorkflowCardDumb'
import { Link, Skeleton, Typography } from '@mui/material'
import { Routes as AppRoutes } from '@cf/router'
import Toolbar from '@mui/material/Toolbar'
import Stack from '@mui/material/Stack'
import FilterButton from '@cfPages/Library/components/FilterButton'
import SortIcon from '@mui/icons-material/Sort'
import FilterIcon from '@mui/icons-material/FilterAlt'
import { prepareBackendDataForWorkflowCardDumb } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/utilityFunctions'
import { useEffect, useState } from 'react'
import { SearchOption, SortDirection } from '@cfPages/Library/components/types'
import FilterWorkflows from '@cfPages/Library/components/FilterWorkflows'
import { LibraryObjectType } from '@cf/types/enum'
import { ELibraryObject } from '@XMLHTTP/types/entity'

type SearchOptionsState = {
  page: number
  sortOptions: SearchOption[]
  filterGroups: { [key: string]: SearchOption[] }
}
const defaultOptions: SearchOptionsState = {
  page: 0,
  sortOptions: [
    {
      name: 'recent',
      label: 'Recent'
    },
    {
      name: 'a-z',
      label: 'A - Z'
    },
    {
      name: 'date',
      label: 'Creation date'
    }
  ],
  filterGroups: {
    keyword: [
      {
        name: 'keyword',
        label: _t('search'),
        value: ''
      }
    ],
    filterOptions: [
      {
        name: 'all',
        label: _t('All'),
        value: null,
        enabled: true
      },
      {
        name: 'owned',
        label: _t('Owned'),
        value: true
      },
      {
        name: 'shared',
        label: _t('Shared'),
        value: true
      },
      {
        name: 'favorites',
        label: _t('Favorites'),
        value: true
      },
      {
        name: 'archived',
        label: _t('Archived'),
        value: true
      }
    ]
  }
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
function reduceStateToSearchArgs(stateParams: SearchOptionsState): SearchArgs {
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
/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibraryPage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const navigate = useNavigate()
  // these are the UI filters, they represent the state of the UI grouping, separated into different sections
  const [searchParameters, setSearchParameters] =
    useState<SearchOptionsState>(defaultOptions)

  // this are the formatted search args, reduced to only active filters, and formatted in a flat list for the API call
  // update to UI state, triggers an update to the search Args state, which in turn triggers useQuery
  // there is room for optimization / refactoring but do not recombine these states: UI filters are arbitrarily broken up and a presented in different ways
  // this grouping should not leak into the final API arguments calls
  const [searchArgs, setSearchArgs] = useState<SearchArgs>({})

  const { data, error, isLoading, isError } =
    useQuery<LibraryObjectsSearchQueryResp>({
      queryKey: ['libraryObjectsSearchQuery', searchArgs], // how to manager the cache key
      queryFn: () => {
        // translate the UI filter state to 'flat' search arguments that can be used to call the query
        return libraryObjectsSearchQuery(searchArgs)
      }
    })

  useEffect(() => {
    const args = reduceStateToSearchArgs(searchParameters)
    setSearchArgs(args)
  }, [searchParameters])

  /*******************************************************
   * RENDER
   *******************************************************/

  function navigateToItem(item: ELibraryObject) {
    const basePath =
      item.type === LibraryObjectType.PROJECT
        ? AppRoutes.PROJECT
        : AppRoutes.WORKFLOW_OVERVIEW
    const path = generatePath(basePath, {
      id: String(item.id)
    })
    navigate(path)
  }

  function formatCards(data: ELibraryObject[]): WorkflowCardTypeUI[] {
    return data.map((item: ELibraryObject): WorkflowCardTypeUI => {
      const formattedCardData = prepareBackendDataForWorkflowCardDumb(item)
      return {
        ...formattedCardData,
        onClick: () => navigateToItem(item)
      }
    })
  }

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

    const cards = formatCards(data.data_package.results)
    return (
      <>
        {!cards.length && <Typography>{_t('No results found')}</Typography>}

        {cards.map((item) => (
          <WorkflowCardDumb key={`workflow_${item.id}`} {...item} />
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
        workflows={formatCards(data.data_package.results)} // @todo memoize
        // @todo need to handle key down (enter) which will trigger the main search results
        onChange={(workflow) => {
          const match = data.data_package.results.find(
            (el) => workflow.id === el.id
          )
          navigateToItem(match)
        }}
      />
    )
  }

  return (
    <OuterContentWrap>
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
          </Stack>
          <FilterWorkflowResults />
        </Stack>
      </Toolbar>

      <GridWrap>
        <Results />
      </GridWrap>
    </OuterContentWrap>
  )
}

export default LibraryPage
