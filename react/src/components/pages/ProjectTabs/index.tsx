import { OuterContentWrap } from '@cf/mui/helper'
import { CFRoutes, RelativeRoutes } from '@cf/router'
import { ProjectDetailsType } from '@cf/types/common'
import { LibraryObjectType } from '@cf/types/enum'
import { formatProjectEntity } from '@cf/utility/marshalling/projectDetail'
import { _t } from '@cf/utility/utilityFunctions'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import Loader from '@cfComponents/UIPrimitives/Loader'
import StarIcon from '@mui/icons-material/Star'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toggleFavouriteMutation } from '@XMLHTTP/API/library'
import { getProjectById } from '@XMLHTTP/API/project'
import { EmptyPostResp, GetProjectByIdQueryResp } from '@XMLHTTP/types/query'
import { enqueueSnackbar } from 'notistack'
import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  Route,
  Routes,
  generatePath,
  matchPath,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom'

import TabOverview from './components/TabOverview'
import TabWorkflows from './components/TabWorkflows'

const ProjectDetails = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { id } = useParams()
  const projectId = Number(id)
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<RelativeRoutes>()
  const [project, setProject] = useState<ProjectDetailsType>()

  const navigate = useNavigate()

  const { data, error, isLoading, isError } = useQuery<GetProjectByIdQueryResp>(
    {
      queryKey: ['getProjectById', projectId],
      queryFn: () => getProjectById(projectId)
    }
  )

  /*******************************************************
   * LIFE CYCLE
   *******************************************************/
  // not really a big fan of this solution...
  // is this really how RR would implement this?
  // here is probably a better solution
  // https://blog.stackademic.com/how-to-implement-tabs-that-sync-with-react-router-e255e0e90cfd
  // we use the same pattern in: workspace tabs
  useEffect(() => {
    const match = tabsObject.find((tab) =>
      matchPath({ path: tab.path, end: true }, location.pathname)
    )
    setActiveTab(match.relativePath)
  }, [])

  useEffect(() => {
    if (!data?.data_package) return

    const project = formatProjectEntity(
      data.data_package.project_data,
      COURSEFLOW_APP.globalContextData.disciplines
    )
    setProject(project)
  }, [data])

  /*******************************************************
   * QUERIES
   *******************************************************/

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const tabsObject = [
    {
      path: CFRoutes.PROJECT,
      relativePath: RelativeRoutes.INDEX,
      label: _t('Overview'),
      action: () => {
        const path = generatePath(CFRoutes.PROJECT, {
          id: String(projectId)
        })
        navigate(path)
      }
    },
    {
      path: CFRoutes.PROJECT_WORKFLOW,
      relativePath: RelativeRoutes.WORKFLOW,
      label: _t('Workflows'),
      action: () => {
        const path = generatePath(CFRoutes.PROJECT_WORKFLOW, {
          id: String(projectId)
        })
        navigate(path)
      }
    }
  ]

  const tabs = tabsObject.map((item, index) => {
    return (
      <Tab
        key={item.relativePath}
        label={item.label}
        value={item.relativePath}
        onClick={() => {
          const path = generatePath(item.path, { id })
          navigate(path)
        }}
      />
    )
  })

  /*******************************************************
   * CONSTANTS
   *******************************************************/
  if (isLoading || !project) return <Loader />
  if (isError) return <div>An error occurred: {error.message}</div>

  /*******************************************************
   * RENDER
   *******************************************************/
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
            <Favourite
              id={project.id}
              isFavorite={project.isFavorite}
              type={LibraryObjectType.PROJECT}
            />
          </Box>
        </Stack>
      </OuterContentWrap>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <OuterContentWrap sx={{ pb: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue: RelativeRoutes) => setActiveTab(newValue)}
          >
            {tabs}
          </Tabs>
        </OuterContentWrap>
      </Box>

      <Routes>
        <Route index path="/" element={<TabOverview {...project} />} />
        <Route
          path={RelativeRoutes.WORKFLOW}
          element={<TabWorkflows projectId={projectId} />}
        />
      </Routes>
    </>
  )
}

export default ProjectDetails
