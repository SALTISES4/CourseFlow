import { GridWrap, OuterContentWrap } from '@cf/mui/helper'
import WorkflowCardDumb from '@cfPages/Styleguide/components/WorkflowCard'

import data from './data'

import Toolbar from '@mui/material/Toolbar'
import Stack from '@mui/material/Stack'
import FilterButton from '@cfPages/Styleguide/components/FilterButton'
import SortIcon from '@mui/icons-material/Sort'
import FilterIcon from '@mui/icons-material/FilterAlt'
import FilterWorkflows from '@cfPages/Styleguide/components/FilterWorkflows'

const Library = () => {
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
              options={data.filterSortOptions}
              icon={<SortIcon />}
              onChange={(val, dir) => console.log(val, dir)}
              placeholder="Sort"
            />
            <FilterButton
              options={data.filterProjectOptions}
              icon={<FilterIcon />}
              onChange={(val) => console.log('projects filter changed to', val)}
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
  )
}

export default Library
