import { ProjectDetailOut } from '@cf/api/gen'
import { CFRoutes, RelativeRoutes } from '@cf/router/appRoutes'
import { OuterContentWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Route,
  Routes,
  generatePath,
  matchPath,
  useLocation,
  useNavigate
} from 'react-router-dom'

import TabOverview from './Overview'
import TabWorkflows from './Workflows'

const ProjectTabs = ({ project }: { project: ProjectDetailOut }) => {
  const { t } = useTranslation('project')
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<RelativeRoutes>(
    RelativeRoutes.INDEX
  )
  const navigate = useNavigate()

  const tabsObject = useMemo(
    () => [
      {
        path: CFRoutes.PROJECT,
        relativePath: RelativeRoutes.INDEX,
        label: t('tabs.overview'),
        action: () => {
          const path = generatePath(CFRoutes.PROJECT, {
            uuid: project.uuid
          })
          navigate(path)
        }
      },
      {
        path: CFRoutes.PROJECT_WORKFLOW,
        relativePath: RelativeRoutes.WORKFLOWS,
        label: t('tabs.workflows'),
        action: () => {
          const path = generatePath(CFRoutes.PROJECT_WORKFLOW, {
            uuid: project.uuid
          })
          navigate(path)
        }
      }
    ],
    [navigate, project.uuid, t]
  )

  const tabs = tabsObject.map((item) => (
    <Tab
      key={item.relativePath}
      label={item.label}
      value={item.relativePath}
      onClick={() => {
        const path = generatePath(item.path, { uuid: project.uuid })
        navigate(path)
      }}
    />
  ))

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
    if (match) {
      setActiveTab(match.relativePath)
    }
  }, [tabsObject, location.pathname])

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <OuterContentWrap style={{ paddingBottom: 0 }}>
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
          path={RelativeRoutes.WORKFLOWS}
          element={<TabWorkflows uuid={project.uuid} />}
        />
      </Routes>
    </>
  )
}

export default ProjectTabs
