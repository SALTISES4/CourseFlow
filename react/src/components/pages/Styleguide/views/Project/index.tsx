import { useState } from 'react'
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom'
import { OuterContentWrap } from '@cf/mui/helper'
import { CFRoutes as AppRoutes } from '@cf/router'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TabOverview from './components/TabOverview'
import TabWorkflows from './components/TabWorkflows'
import TabWorkspace from './components/TabWorkspace'
import StarIcon from '@mui/icons-material/Star'

// move to props / internal fetcher / react query
import data from './data'

const ProjectDetails = () => {
  const location = useLocation()
  const [tab, setTab] = useState<AppRoutes>(location.pathname as AppRoutes)
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
            onChange={(_, newValue: AppRoutes) => setTab(newValue)}
          >
            <Tab
              label="Overview"
              value={AppRoutes.STYLEGUIDE_PROJECT}
              onClick={() => navigate(AppRoutes.STYLEGUIDE_PROJECT)}
            />
            <Tab
              label="Workflows"
              value={AppRoutes.STYLEGUIDE_PROJECT_WORKFLOWS}
              onClick={() => navigate(AppRoutes.STYLEGUIDE_PROJECT_WORKFLOWS)}
            />
            <Tab
              label="Workspaces"
              value={AppRoutes.STYLEGUIDE_PROJECT_WORKSPACE}
              onClick={() => navigate(AppRoutes.STYLEGUIDE_PROJECT_WORKSPACE)}
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
