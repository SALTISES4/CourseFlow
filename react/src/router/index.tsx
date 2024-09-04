import { createBrowserRouter } from 'react-router-dom'
import Base from '@cf/base'
import Home from '@cfPages/Home'
import NotificationsPage from '@cfPages/Notifications'
import NotificationsSettingsPage from '@cfPages/NotificationsSettings'
import ProfileSettingsPage from '@cfPages/ProfileSettings'
import WorkflowComparison from '@cfPages/Workspace/ProjectComparison'
import ProjectDetail from '@cfPages/ProjectDetail'
import WorkflowPage from '@cfPages/Workspace/Workflow'
import { WorkflowViewType } from '@cf/types/enum'
import MyLibrary from '@cfPages/Library/MyLibrary'
import Favourites from '@cfPages/Library/Favourites'
import Explore from '@cfPages/Library/Explore'
import ProjectTabs from '@cfPages/ProjectTabs'

// Styleguide views
import Styleguide from '@cfPages/Styleguide'
import StyleguideProject from '@cfPages/Styleguide/views/Project'

/*******************************************************
 * NOTE:  RR6 drastically altered it's approach and no longer robustly supports absolute paths
 * this is a workaround until we finalize a 'pattern'
 * see: https://github.com/remix-run/react-router/discussions/9841
 *******************************************************/
const DOMAIN = 'course-flow'

export enum RelativeRoutes {
  INDEX = '/',
  WORKFLOW = `workflow`,
  ALIGNMENTANALYSIS = `alignment`,
  OUTCOMETABLE = `outcometable`,
  OUTCOME_EDIT = `outcomedit`,
  GRID = `grid`
}

export enum CFRoutes {
  HOME = `/${DOMAIN}/home`,
  LIBRARY = `/${DOMAIN}/library`,
  FAVOURITES = `/${DOMAIN}/favourites`,
  EXPLORE = `/${DOMAIN}/explore`,
  NOTIFICATIONS = `/${DOMAIN}/user/notifications`,
  NOTIFICATIONS_SETTINGS = `/${DOMAIN}/user/notifications-settings`,
  PROFILE_SETTINGS = `/${DOMAIN}/user/profile-settings`,
  PROJECT_COMPARISON = `/${DOMAIN}/project/:id/comparison`,
  PROJECT = `/${DOMAIN}/project/:id`,
  //
  WORKFLOW = `/${DOMAIN}/workflow/:id/*`,
  WORKFLOW_OVERVIEW = `/${DOMAIN}/workflow/:id`,
  WORKFLOW_WORKFLOW = `/${DOMAIN}/workflow/:id/${RelativeRoutes.WORKFLOW}`,
  WORKFLOW_ALIGNMENTANALYSIS = `/${DOMAIN}/workflow/:id/${RelativeRoutes.ALIGNMENTANALYSIS}`,
  WORKFLOW_OUTCOMETABLE = `/${DOMAIN}/workflow/:id/${RelativeRoutes.OUTCOMETABLE}`,
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

export const CfRouter = createBrowserRouter([
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
        element: (
          <Base>
            <Styleguide />
          </Base>
        )
      },
      {
        path: `${CFRoutes.STYLEGUIDE_PROJECT}/*`,
        element: (
          <Base>
            <StyleguideProject />
          </Base>
        )
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
    path: CFRoutes.PROJECT,
    element: (
      <Base>
        <ProjectDetail />
      </Base>
    )
  },
  {
    path: `${CFRoutes.TEMP_PROJECT}/*`,
    element: (
      <Base>
        <ProjectTabs />
      </Base>
    )
  },
  {
    path: `${CFRoutes.WORKFLOW_OVERVIEW}/*`,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowPage initialView={WorkflowViewType.WORKFLOW_OVERVIEW} />
      </Base>
    )
    // children: [
    //   {
    //     path: CFRoutes.WORKFLOW_WORKFLOW
    //   },
    //   {
    //     path: CFRoutes.WORKFLOW_ALIGNMENTANALYSIS
    //   },
    //   {
    //     path: CFRoutes.WORKFLOW_OUTCOMETABLE
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
    //         {/*      <WorkflowPage initialView={ViewType.WORKFLOW} />*/}
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={ViewType.WORKFLOW_OVERVIEW} />
    //       </Base>
    //     )
    //   },
    //   {
    //     path: Routes.WORKFLOW_ALIGNMENTANALYSIS,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={ViewType.WORKFLOW_ALIGNMENTANALYSIS} />
    //       </Base>
    //     )
    //   },
    //   {
    //     path: Routes.WORKFLOW_OUTCOMETABLE,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={ViewType.OUTCOMETABLE} />
    //       </Base>
    //     )
    //   },
    //   {
    //     path: Routes.WORKFLOW_OUTCOME_EDIT,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={ViewType.OUTCOME_EDIT} />
    //       </Base>
    //     )
    //   },
    //   {
    //     path: Routes.WORKFLOW_GRID,
    //     element: (
    //       <Base>
    //         {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
    //         <WorkflowPage initialView={ViewType.GRID} />
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

export default CfRouter
