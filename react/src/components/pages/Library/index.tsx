import * as React from 'react'
import { LibraryObjectsSearchQueryResp } from '@XMLHTTP/types/query'
import { libraryObjectsSearchQuery } from '@XMLHTTP/API/pages'
import { GridWrap, OuterContentWrap } from '@cfMUI/helper'
import { useQuery } from '@tanstack/react-query'
import Loader from '@cfCommonComponents/UIComponents/Loader'
import { generatePath, Link as LinkRouter, useNavigate } from 'react-router-dom'
import WorkflowCardDumb, {
  PropsType as WorkflowCardTypeUI
} from '@cfCommonComponents/cards/WorkflowCardDumb'
import { Link, Typography } from '@mui/material'
import { Routes as AppRoutes } from '@cf/router'
import Toolbar from '@mui/material/Toolbar'
import Stack from '@mui/material/Stack'
import FilterButton from '@cfPages/Library/components/FilterButton'
import SortIcon from '@mui/icons-material/Sort'
import FilterWorkflows from '@cfPages/Library/components/FilterWorkflows'
import FilterIcon from '@mui/icons-material/FilterAlt'
import { prepareBackendDataForWorkflowCardDumb } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/utilityFunctions'
import { useState } from 'react'
import {
  Filters,
  SortableFilterOption,
  SortDirection
} from '@cfPages/Library/components/types'

const defaultFilter: Filters = {
  keyword: '',
  filterSortOptions: [
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
  filterProjectOptions: [
    {
      name: 'all',
      label: _t('All'),
      selected: true
    },
    {
      name: 'owned',
      label: _t('Owned')
    },
    {
      name: 'shared',
      label: _t('Shared')
    },
    {
      name: 'favorites',
      label: _t('Fovorites')
    },
    {
      name: 'archived',
      label: _t('Archived')
    }
  ]
}

function updateFilterOptions(
  options: SortableFilterOption[],
  currentSelection: { name: string; direction?: SortDirection }
): SortableFilterOption[] {
  return options.map((option) => {
    // Set 'selected' based on if the option's name matches the current selection's name
    const isSelected = option.name === currentSelection.name

    // Decide the 'direction' value: if the current selection has a direction and matches the name, use it, otherwise keep the original or set undefined
    let directionValue
    if (currentSelection.direction && isSelected) {
      directionValue = currentSelection.direction
    } else {
      directionValue = option.direction
    }

    return {
      ...option,
      selected: isSelected,
      direction: isSelected ? directionValue : undefined
    }
  })
}

type State = {
  filters: Filters
  page: number
}
/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibraryPage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const navigate = useNavigate()
  const [searchParameters, setSearchParameters] = useState<{
    filters: Filters
    page: number
  }>({
    filters: defaultFilter,
    page: 0
  })

  const { data, error, isLoading, isError } =
    useQuery<LibraryObjectsSearchQueryResp>({
      queryKey: [
        'libraryObjectsSearchQuery',
        searchParameters.filters,
        searchParameters.page
      ],
      queryFn: () =>
        libraryObjectsSearchQuery({
          filters: searchParameters.filters,
          page: searchParameters.page
        })
    })

  /*******************************************************
   * RENDER
   *******************************************************/

  if (isLoading) return <Loader />
  if (!data || isError) return <div>error</div>

  const cards = data.data_package.map((item, index): WorkflowCardTypeUI => {
    const formattedCardData = prepareBackendDataForWorkflowCardDumb(item)
    return {
      ...formattedCardData,
      onClick: () => {
        const path = generatePath(AppRoutes.WORKFLOW_OVERVIEW, {
          id: String(item.id)
        })
        navigate(path)
      }
    }
  })

  const Results = () => {
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
              options={searchParameters.filters.filterSortOptions}
              icon={<SortIcon />}
              onChange={(val, dir) => {
                const newFilterSortOptions = updateFilterOptions(
                  searchParameters.filters.filterSortOptions,
                  { name: val, direction: dir }
                )
                setSearchParameters({
                  ...searchParameters,
                  filters: {
                    ...searchParameters.filters,
                    filterSortOptions: newFilterSortOptions
                  }
                })
              }}
              placeholder="Sort"
            />

            <FilterButton
              options={searchParameters.filters.filterProjectOptions}
              icon={<FilterIcon />}
              onChange={(val) => {
                const newFilterProjectOptions = updateFilterOptions(
                  searchParameters.filters.filterProjectOptions,
                  { name: val }
                )
                setSearchParameters({
                  ...searchParameters,
                  filters: {
                    ...searchParameters.filters,
                    filterProjectOptions: newFilterProjectOptions
                  }
                })
              }}
            />
          </Stack>

          <FilterWorkflows
            workflows={cards}
            onChange={(workflow) => console.log('clicked', workflow)}
          />
        </Stack>
      </Toolbar>

      <GridWrap>
        <Results />
      </GridWrap>
    </OuterContentWrap>
  )
}

export default LibraryPage
