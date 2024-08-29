// @ts-nocheck
import * as React from 'react'
import WorkflowFilter from '@cfCommonComponents/filters/WorkflowFilter/index.jsx'
import { Workflow } from '@cfModule/types/common'
import {
  PageLibraryQueryResp,
  PageExploreQueryResp
} from '@XMLHTTP/types/query'
import {
  fetchExploreContext,
  fetchLibraryContext,
  getLibraryQuery
} from '@XMLHTTP/API/pages'
import MenuBar from '@cfCommonComponents/layout/MenuBar'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import { GridWrap, OuterContentWrap } from '@cfMUI/helper'
import Toolbar from '@mui/material/Toolbar'
import Stack from '@mui/material/Stack'
import FilterButton from '@cfPages/Styleguide/components/FilterButton'
import data from '@cfPages/Styleguide/views/Library/data'
import SortIcon from '@mui/icons-material/Sort'
import FilterIcon from '@mui/icons-material/FilterAlt'
import FilterWorkflows from '@cfPages/Styleguide/components/FilterWorkflows'
import WorkflowCardDumb from '@cfPages/Styleguide/components/WorkflowCard'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

type StateType = {
  project_data?: Workflow[]
}
/*******************************************************
 * @LibraryRenderer
 *******************************************************/
const LibraryPage = () => {
  const [state, setState] = useState<StateType>({ project_data: [] })

  const { data, error, isLoading, isError } = useQuery<PageLibraryQueryResp>({
    queryKey: ['fetchLibraryContext'],
    queryFn: fetchLibraryContext
  })

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  useEffect(() => {
    getLibraryQuery((data: PageLibraryQueryResp) => {
      setState({
        project_data: data.data_package
      })
    })
  })

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <>
      <WorkflowFilter workflows={state.project_data} context="library" />

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
                options={data.filterSortOptions}
                icon={<SortIcon />}
                onChange={(val, dir) => console.log(val, dir)}
                placeholder="Sort"
              />
              <FilterButton
                options={data.filterProjectOptions}
                icon={<FilterIcon />}
                onChange={(val) =>
                  console.log('projects filter changed to', val)
                }
              />
            </Stack>

            <FilterWorkflows
              workflows={data.workflows}
              onChange={(workflow) => console.log('clicked', workflow)}
            />
          </Stack>
        </Toolbar>

        <GridWrap>
          {data.templates.map((template, index) => (
            <WorkflowCardDumb key={index} {...template} />
          ))}
        </GridWrap>
      </OuterContentWrap>
    </>
  )
}

export default LibraryPage
