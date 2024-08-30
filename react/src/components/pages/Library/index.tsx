import * as React from 'react'
import WorkflowFilter from '@cfCommonComponents/filters/WorkflowFilter/index.jsx'
import { PageLibraryQueryResp } from '@XMLHTTP/types/query'
import { fetchLibraryContext } from '@XMLHTTP/API/pages'
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

const filterSortOptions = [
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
]

const filterProjectOptions = [
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

/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibraryPage = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { data, error, isLoading, isError } = useQuery<PageLibraryQueryResp>({
    queryKey: ['fetchLibraryContext'],
    queryFn: fetchLibraryContext
  })
  const navigate = useNavigate()

  /*******************************************************
   * RENDER
   *******************************************************/

  if (isLoading) return <Loader />
  if (!data || error) return <div>error</div>

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
    <>
      <WorkflowFilter workflows={data.data_package} context="library" />

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
                options={filterSortOptions}
                icon={<SortIcon />}
                onChange={(val, dir) => console.log(val, dir)}
                placeholder="Sort"
              />
              <FilterButton
                options={filterProjectOptions}
                icon={<FilterIcon />}
                onChange={(val) =>
                  console.log('projects filter changed to', val)
                }
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
    </>
  )
}

export default LibraryPage
