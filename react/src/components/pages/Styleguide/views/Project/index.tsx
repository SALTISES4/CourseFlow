import { OuterContentWrap } from '@cf/mui/helper'
import { CFRoutes } from '@cf/router/appRoutes'
import StarIcon from '@mui/icons-material/Star'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import TabOverview from './components/TabOverview'
import TabWorkflows from './components/TabWorkflows'
import TabWorkspace from './components/TabWorkspace'

// move to props / internal fetcher / react query
import data from './data'

const ProjectDetails = () => {
  const location = useLocation()
  const [tab, setTab] = useState<CFRoutes>(location.pathname as CFRoutes)
  const navigate = useNavigate()

  return (
    <>
      <OuterContentWrap sx={{ pb: 0 }}>
        <Stack
          direction="row"
          spacing={3}
          justifyContent="space-between"
          sx={{ mt: 6, mb: 3 }}
        >
          <Typography component="h1" variant="h4">
            {data.title}
          </Typography>
          <Box>
            <IconButton
              aria-label="Favourite"
              sx={{
                color: data.isFavorite
                  ? 'courseflow.favouriteActive'
                  : 'courseflow.favouriteInactive'
              }}
              onClick={() => console.log('favorited', data)}
            >
              <StarIcon />
            </IconButton>
          </Box>
        </Stack>
      </OuterContentWrap>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <OuterContentWrap sx={{ pb: 0 }}>
          <Tabs
            value={tab}
            onChange={(_, newValue: CFRoutes) => setTab(newValue)}
          >
            <Tab
              label="Overview"
              value={CFRoutes.STYLEGUIDE_PROJECT}
              onClick={() => navigate(CFRoutes.STYLEGUIDE_PROJECT)}
            />
            <Tab
              label="Workflows"
              value={CFRoutes.STYLEGUIDE_PROJECT_WORKFLOWS}
              onClick={() => navigate(CFRoutes.STYLEGUIDE_PROJECT_WORKFLOWS)}
            />
            <Tab
              label="Workspaces"
              value={CFRoutes.STYLEGUIDE_PROJECT_WORKSPACE}
              onClick={() => navigate(CFRoutes.STYLEGUIDE_PROJECT_WORKSPACE)}
            />
          </Tabs>
        </OuterContentWrap>
      </Box>

      <Routes>
        <Route path="/" element={<TabOverview {...data} />} />
        <Route path="/workflows" element={<TabWorkflows />} />
        <Route path="/workspace" element={<TabWorkspace />} />
      </Routes>
    </>
  )
}

export default ProjectDetails
