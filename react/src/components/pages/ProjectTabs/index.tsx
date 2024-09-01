import { useState } from 'react'
import {
  useLocation,
  useNavigate,
  Routes,
  Route,
  useParams
} from 'react-router-dom'
import { OuterContentWrap } from '@cf/mui/helper'
import { Routes as AppRoutes } from '@cf/router'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TabOverview from './components/TabOverview'
import TabWorkflows from './components/TabWorkflows'
import StarIcon from '@mui/icons-material/Star'

import { useQuery } from '@tanstack/react-query'
import { GetProjectByIdQueryResp } from '@XMLHTTP/types/query'
import { getProjectById } from '@XMLHTTP/API/project'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { formatProjectEntity } from '@cf/utility/marshalling/projectDetail'

const ProjectDetails = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const projectId = 5

  const location = useLocation()
  const [tab, setTab] = useState<AppRoutes>(location.pathname as AppRoutes)
  const navigate = useNavigate()
  const { id } = useParams()

  const { data, error, isLoading, isError } = useQuery<GetProjectByIdQueryResp>(
    {
      queryKey: ['getProjectById', projectId],
      queryFn: () => getProjectById(projectId)
    }
  )

  if (isLoading) return <Loader />
  if (isError) return <div>An error occurred: {error.message}</div>

  const project = formatProjectEntity(data.data_package.project_data)

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
            {project.title}
          </Typography>
          <Box>
            <IconButton
              aria-label="Favourite"
              sx={{
                color: project.isFavorite
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
              value={AppRoutes.TEMP_PROJECT}
              onClick={() => navigate(AppRoutes.TEMP_PROJECT)}
            />
            <Tab
              label="Workflows"
              value={AppRoutes.TEMP_PROJECT_WORKFLOWS}
              onClick={() => navigate(AppRoutes.TEMP_PROJECT_WORKFLOWS)}
            />
          </Tabs>
        </OuterContentWrap>
      </Box>

      <Routes>
        <Route path="/" element={<TabOverview {...project} />} />
        <Route
          path="/workflows"
          element={<TabWorkflows projectId={projectId} />}
        />
      </Routes>
    </>
  )
}

export default ProjectDetails
