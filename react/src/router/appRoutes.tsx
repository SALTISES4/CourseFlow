import Base from '@cf/base'
import Home from '@cfPages/Home'
import Explore from '@cfPages/Library/Explore'
import Favourites from '@cfPages/Library/Favourites'
import MyLibrary from '@cfPages/Library/MyLibrary'
import NotificationsPage from '@cfPages/Notifications'
import WorkflowPage from '@cfPages/Workspace/Workflow'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import { createBrowserRouter } from 'react-router-dom'

import NotificationsSettingsPage from 'components/pages/Settings/NotificationsSettings'
import ProfileSettingsPage from 'components/pages/Settings/ProfileSettings'
import Project from 'components/pages/Workspace/Project'

/*******************************************************
 * NOTE:  RR6 drastically altered it's approach and no longer robustly supports absolute paths
 * this is a workaround until we finalize a 'pattern'
 * see: https://github.com/remix-run/react-router/discussions/9841
 *******************************************************/
const DOMAIN = 'course-flow'

export enum RelativeRoutes {
  // COMMON
  INDEX = '/',
  WORKFLOW = `workflow`,
  // WORKFLOW
  ALIGNMENT_ANALYSIS = `alignment`,
  OUTCOME_TABLE = `outcometable`,
  OUTCOME_EDIT = `outcomedit`,
  GRID = `grid`,
  // PROJECT
  COMPARISON = 'comparison'
}

export enum CFRoutes {
  HOME = `/${DOMAIN}/home`,
  LIBRARY = `/${DOMAIN}/library`,
  FAVOURITES = `/${DOMAIN}/favourites`,
  EXPLORE = `/${DOMAIN}/explore`,
  NOTIFICATIONS = `/${DOMAIN}/user/notifications`,
  NOTIFICATIONS_SETTINGS = `/${DOMAIN}/user/notifications-settings`,
  PROFILE_SETTINGS = `/${DOMAIN}/user/profile-settings`,
  //  PROJECT
  PROJECT = `/${DOMAIN}/project/:id`,
  PROJECT_WORKFLOW = `/${DOMAIN}/project/:id/workflow/`,
  // WORKFLOW
  WORKFLOW = `/${DOMAIN}/workflow/:id`,
  WORKFLOW_WORKFLOW = `/${DOMAIN}/workflow/:id/${RelativeRoutes.WORKFLOW}`,
  WORKFLOW_ALIGNMENT_ANALYSIS = `/${DOMAIN}/workflow/:id/${RelativeRoutes.ALIGNMENT_ANALYSIS}`,
  WORKFLOW_OUTCOME_TABLE = `/${DOMAIN}/workflow/:id/${RelativeRoutes.OUTCOME_TABLE}`,
  WORKFLOW_OUTCOME_EDIT = `/${DOMAIN}/workflow/:id/${RelativeRoutes.OUTCOME_EDIT}`,
  WORKFLOW_GRID = `/${DOMAIN}/workflow/:id/${RelativeRoutes.GRID}`
}

export const CFRouter = createBrowserRouter([
  {
    path: CFRoutes.HOME,
    element: (
      <Base showNotifications>
        <Home />
      </Base>
    )
  },
  {
    path: CFRoutes.FAVOURITES,
    element: (
      <Base>
        <Favourites />
      </Base>
    )
  },
  {
    path: CFRoutes.LIBRARY,
    element: (
      <Base>
        <MyLibrary />
      </Base>
    )
  },
  {
    path: CFRoutes.EXPLORE,
    element: (
      <Base>
        <Explore />
      </Base>
    )
  },
  {
    path: CFRoutes.NOTIFICATIONS,
    element: (
      <Base>
        <NotificationsPage />
      </Base>
    )
  },
  {
    path: CFRoutes.NOTIFICATIONS_SETTINGS,
    element: (
      <Base>
        <NotificationsSettingsPage />
      </Base>
    )
  },
  {
    path: CFRoutes.PROFILE_SETTINGS,
    element: (
      <Base>
        <ProfileSettingsPage />
      </Base>
    )
  },
  {
    path: `${CFRoutes.PROJECT}/*`,
    element: (
      <Base>
        <Project />
      </Base>
    )
  },
  {
    path: `${CFRoutes.WORKFLOW}/*`,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowPage initialView={WorkflowViewType.OVERVIEW} />
      </Base>
    )
  },
  {
    path: '*',
    element: <div>in browser router, caught </div>,
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_startTransition: true,
      v7_skipActionStatusRevalidation: true
    }
  }
])

export default CFRouter
