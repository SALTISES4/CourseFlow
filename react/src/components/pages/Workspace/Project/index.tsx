import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { ActionMenu } from '@cf/components/pages/Workspace/Project/components/MenuBar/menus'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import { ProjectDetailsType } from '@cf/types/common'
import { mapProjectV2ToProjectDetails } from '@cf/utility/marshalling/projectDetail'
import { _t } from '@cf/utility/Utility.class'
import MenuBar from '@cfComponents/globalNav/MenuBar'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { OuterContentWrap } from '@cfMUI/helper'
import Header from '@cfPages/Workspace/Project/components/Header'
import ProjectDialogs from '@cfPages/Workspace/Project/components/ProjectDialogs'
import ErrorView from '@cfViews/MsgViews/ErrorView'
import TabOverview from '@cfViews/ProjectView/TabOverview'
import TabWorkflows from '@cfViews/ProjectView/TabWorkflows'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '@XMLHTTP/API/api'
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
  const { uuid } = useParams()
  const projectUuid = uuid
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<RelativeRoutes>()
  const [project, setProject] = useState<ProjectDetailsType>()
  const navigate = useNavigate()

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data, error, refetch, isLoading, isError } = useQuery({
    ...getProjectOptions({
      path: {
        uuid: projectUuid as string
      }
    }),
    enabled: Boolean(projectUuid)
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
    if (!data) {
      return
    }

    setProject(mapProjectV2ToProjectDetails(data.item))
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
          uuid: projectUuid
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
          uuid: projectUuid
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
          const path = generatePath(item.path, { uuid: projectUuid })
          navigate(path)
        }}
      />
    )
  })

  /*******************************************************
   * CONSTANTS
   *******************************************************/
  if (isLoading || !project) {
    return <Loader />
  }
  if (isError) {
    return (
      <ErrorView message={`An error occurred: ${getErrorMessage(error)}`} />
    )
  }

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
            element={<TabWorkflows projectUuid={projectUuid!} />}
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
