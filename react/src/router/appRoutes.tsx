import Base from '@cf/base'
import Home from '@cfPages/Home'
import Explore from '@cfPages/Library/Explore'
import Favourites from '@cfPages/Library/Favourites'
import MyLibrary from '@cfPages/Library/MyLibrary'
import NotificationsPage from '@cfPages/Notifications'
// Styleguide views
import WorkflowComparison from '@cfPages/Workspace/ProjectComparison'
import WorkflowPage from '@cfPages/Workspace/Workflow'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import NotificationsSettingsPage from 'components/pages/Settings/NotificationsSettings'
import ProfileSettingsPage from 'components/pages/Settings/ProfileSettings'
import Project from 'components/pages/Workspace/Project'
import { createBrowserRouter } from 'react-router-dom'

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
  PROJECT_COMPARISON = `/${DOMAIN}/project/:id/${RelativeRoutes.COMPARISON}`,
  // WORKFLOW
  WORKFLOW = `/${DOMAIN}/workflow/:id`,
  WORKFLOW_WORKFLOW = `/${DOMAIN}/workflow/:id/${RelativeRoutes.WORKFLOW}`,
  WORKFLOW_ALIGNMENT_ANALYSIS = `/${DOMAIN}/workflow/:id/${RelativeRoutes.ALIGNMENT_ANALYSIS}`,
  WORKFLOW_OUTCOME_TABLE = `/${DOMAIN}/workflow/:id/${RelativeRoutes.OUTCOME_TABLE}`,
  WORKFLOW_OUTCOME_EDIT = `/${DOMAIN}/workflow/:id/${RelativeRoutes.OUTCOME_EDIT}`,
  WORKFLOW_GRID = `/${DOMAIN}/workflow/:id/${RelativeRoutes.GRID}`,

  // STYLEGUIDE - Static UI routes
  STYLEGUIDE = `/${DOMAIN}/styleguide`,
  STYLEGUIDE_PROJECT = `/${DOMAIN}/styleguide/project`,
  STYLEGUIDE_PROJECT_WORKFLOWS = `/${DOMAIN}/styleguide/project/workflows`,
  STYLEGUIDE_PROJECT_WORKSPACE = `/${DOMAIN}/styleguide/project/workspace`,

  TEMP_PROJECT = `/${DOMAIN}/temp-project`,
  TEMP_PROJECT_WORKFLOWS = `/${DOMAIN}/temp-project/workflows`
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
    path: CFRoutes.STYLEGUIDE,
    children: [
      {
        path: CFRoutes.STYLEGUIDE,
        element: <></>
      },
      {
        path: `${CFRoutes.STYLEGUIDE_PROJECT}/*`,
        element: <></>
      }
    ]
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
    path: CFRoutes.PROJECT_COMPARISON,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowComparison />
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
    // children: [
    //   {
    //     path: CFRoutes.WORKFLOW_WORKFLOW
    //   },
    //   {
    //     path: CFRoutes.WORKFLOW_ALIGNMENT_ANALYSIS
    //   },
    //   {
    //     path: CFRoutes.WORKFLOW_OUTCOME_TABLE
    //   },
    //   {
    //     path: CFRoutes.WORKFLOW_OUTCOME_EDIT
    //   },
    //   {
    //     path: CFRoutes.WORKFLOW_GRID
    //   }
    // ]
    //  children: [
    //   {
    //     path: Routes.WORKFLOW_WORKFLOW,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         {/*      <WorkflowPage initialView={WorkflowViewType.WORKFLOW} />*/}
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={WorkflowViewType.OVERVIEW} />
    //       </Base>
    //     )
    //   },
    //   {
    //     path: Routes.WORKFLOW_ALIGNMENT_ANALYSIS,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={WorkflowViewType.WORKFLOW_ALIGNMENT_ANALYSIS} />
    //       </Base>
    //     )
    //   },
    //   {
    //     path: Routes.WORKFLOW_OUTCOME_TABLE,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={WorkflowViewType.OUTCOME_TABLE} />
    //       </Base>
    //     )
    //   },
    //   {
    //     path: Routes.WORKFLOW_OUTCOME_EDIT,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={WorkflowViewType.OUTCOME_EDIT} />
    //       </Base>
    //     )
    //   },
    //   {
    //     path: Routes.WORKFLOW_GRID,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={WorkflowViewType.GRID_VIEW} />
    //       </Base>
    //     )
    //   }
    // ]
  },

  {
    path: '*',
    element: <div>in browser router, caught </div>
  }
])

export default CFRouter
