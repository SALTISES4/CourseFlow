import { createBrowserRouter } from 'react-router-dom'
import Base from '@cf/base'
import Home from '@cfPages/Home'
import Favourites from '@cfPages/Favourites'
import Library from '@cfPages/Library'
import Explore from '@cfPages/Explore'
import NotificationsPage from '@cfPages/Notifications'
import NotificationsSettingsPage from '@cfPages/NotificationsSettings'
import ProfileSettingsPage from '@cfPages/ProfileSettings'
import WorkflowComparison from '@cfPages/Workspace/ProjectComparison'
import ProjectDetail from '@cfPages/ProjectDetail'
import WorkflowPage from '@cfPages/Workspace/Workflow'
import { ViewType } from '@cf/types/enum'

// Styleguide views
import Styleguide from '@cfPages/Styleguide'
import StyleguideProject from '@cfPages/Styleguide/views/Project'

const DOMAIN = 'course-flow'
export enum Routes {
  HOME = `/${DOMAIN}/home/`,
  LIBRARY = `/${DOMAIN}/library/`,
  FAVOURITES = `/${DOMAIN}/favourites/`,
  EXPLORE = `/${DOMAIN}/explore/`,
  NOTIFICAIONS = `/${DOMAIN}/user/notifications/`,
  NOTIFICAIONS_SETTINGS = `/${DOMAIN}/user/notifications-settings/`,
  PROFILE_SETTINGS = `/${DOMAIN}/user/profile-settings/`,
  PROJECT_COMPARISON = `/${DOMAIN}/project/:id/comparison`,
  PROJECT = `/${DOMAIN}/project/:id`,
  //
  WORKFLOW_OVERVIEW = `/${DOMAIN}/workflow/:id/`,
  WORKFLOW_WORKFLOW = `/${DOMAIN}/workflow/:id/workflow/`,
  WORKFLOW_ALIGNMENTANALYSIS = `/${DOMAIN}/workflow/:id/alignment/`,
  WORKFLOW_OUTCOMETABLE = `/${DOMAIN}/workflow/:id/outcometable/`,
  WORKFLOW_OUTCOME_EDIT = `/${DOMAIN}/workflow/:id/outcomedit/`,
  WORKFLOW_GRID = `/${DOMAIN}/workflow/:id/grid/`,

  // STYLEGUIDE - Static UI routes
  STYLEGUIDE = `/${DOMAIN}/styleguide/`,
  STYLEGUIDE_PROJECT = `/${DOMAIN}/styleguide/project`,
  STYLEGUIDE_PROJECT_WORKFLOWS = `/${DOMAIN}/styleguide/project/workflows`,
  STYLEGUIDE_PROJECT_WORKSPACE = `/${DOMAIN}/styleguide/project/workspace`
}

export const CfRouter = createBrowserRouter([
  {
    path: Routes.HOME,
    element: (
      <Base showNotifications>
        <Home />
      </Base>
    )
  },
  {
    path: Routes.STYLEGUIDE,
    children: [
      {
        path: Routes.STYLEGUIDE,
        element: (
          <Base>
            <Styleguide />
          </Base>
        )
      },
      {
        path: `${Routes.STYLEGUIDE_PROJECT}/*`,
        element: (
          <Base>
            <StyleguideProject />
          </Base>
        )
      }
    ]
  },
  {
    path: Routes.FAVOURITES,
    element: (
      <Base>
        <Favourites />
      </Base>
    )
  },
  {
    path: Routes.LIBRARY,
    element: (
      <Base>
        <Library />
      </Base>
    )
  },
  {
    path: Routes.EXPLORE,
    element: (
      <Base>
        <Explore />
      </Base>
    )
  },
  {
    path: Routes.NOTIFICAIONS,
    element: (
      <Base>
        <NotificationsPage />
      </Base>
    )
  },
  {
    path: Routes.NOTIFICAIONS_SETTINGS,
    element: (
      <Base>
        <NotificationsSettingsPage />
      </Base>
    )
  },
  {
    path: Routes.PROFILE_SETTINGS,
    element: (
      <Base>
        <ProfileSettingsPage />
      </Base>
    )
  },
  {
    path: Routes.PROJECT_COMPARISON,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowComparison />
      </Base>
    )
  },
  {
    path: Routes.PROJECT,
    element: (
      <Base>
        <ProjectDetail />
      </Base>
    )
  },
  {
    path: Routes.WORKFLOW_OVERVIEW,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        {/*<WorkflowPage initialView={ViewType.WORKFLOW_OVERVIEW} />*/}
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowPage  />
      </Base>
    )
  },
  {
    path: Routes.WORKFLOW_WORKFLOW,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
  {/*      <WorkflowPage initialView={ViewType.WORKFLOW} />*/}
         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowPage />
      </Base>
    )
  },
  {
    path: Routes.WORKFLOW_ALIGNMENTANALYSIS,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowPage initialView={ViewType.WORKFLOW_ALIGNMENTANALYSIS} />
      </Base>
    )
  },
  {
    path: Routes.WORKFLOW_OUTCOMETABLE,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowPage initialView={ViewType.OUTCOMETABLE} />
      </Base>
    )
  },
  {
    path: Routes.WORKFLOW_OUTCOME_EDIT,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowPage initialView={ViewType.OUTCOME_EDIT} />
      </Base>
    )
  },
  {
    path: Routes.WORKFLOW_GRID,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowPage initialView={ViewType.GRID} />
      </Base>
    )
  },

  {
    path: '*',
    element: <div>in browser router, caught </div>
  }
])

export default CfRouter
