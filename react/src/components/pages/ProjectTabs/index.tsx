import TabOverview from '@cf/components/views/ProjectView/TabOverview'
import { getErrorMessage } from '@cf/HTTP/XMLHTTP/API/api'
import { OuterContentWrap } from '@cf/mui/helper'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import { ProjectDetailsType } from '@cf/types/common'
import { formatProjectEntity } from '@cf/utility/marshalling/projectDetail'
import { _t } from '@cf/utility/utilityFunctions'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import Loader from '@cfComponents/UIPrimitives/Loader'
import Header from '@cfPages/ProjectTabs/components/Header'
import { ActionMenu } from '@cfPages/ProjectTabs/components/menuBar/menus'
import ProjectDialogs from '@cfPages/ProjectTabs/components/ProjectDialogs'
import TabWorkflows from '@cfViews/ProjectView/TabWorkflows'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useGetProjectByIdQuery } from '@XMLHTTP/API/project.rtk'
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

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data, error, isLoading, isError } = useGetProjectByIdQuery({
    id: Number(id)
  })

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
    if (!data?.dataPackage) return

    const project = formatProjectEntity(data.dataPackage)
    setProject(project)
  }, [data])

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
  if (isError) return <div>An error occurred: {getErrorMessage(error)}</div>

  const ProjectTabsManager = () => {
    return (
      <>
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

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <>
      <MenuBar leftSection={<ActionMenu />} />
      <Header project={project} />
      <ProjectTabsManager />
      <ProjectDialogs />
    </>
  )
}

export default ProjectDetails
