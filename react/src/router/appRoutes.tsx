import Base from '@cf/base'
import { CFRoutes, RelativeRoutes } from '@cf/router/cfRoutes'
import UserLoginPage from '@cf/router/LoginPage'
import { RequireAuth } from '@cf/router/RequireAuth'
import Home from '@cfPages/Home'
import Explore from '@cfPages/Library/Explore'
import Favourites from '@cfPages/Library/Favourites'
import MyLibrary from '@cfPages/Library/MyLibrary'
import NotificationsPage from '@cfPages/Notifications'
import NotificationsSettingsPage from '@cfPages/Settings/NotificationsSettings'
import ProfileSettingsPage from '@cfPages/Settings/ProfileSettings'
import UserRegisterPage from '@cfPages/SignIn/Register'
import Project from '@cfPages/Workspace/Project'
import WorkflowPage from '@cfPages/Workspace/Workflow'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import { Navigate, createBrowserRouter } from 'react-router-dom'

/*******************************************************
 * NOTE:  RR6 drastically altered it's approach and no longer robustly supports absolute paths
 * this is a workaround until we finalize a 'pattern'
 * see: https://github.com/remix-run/react-router/discussions/9841
 *******************************************************/

export { CFRoutes, RelativeRoutes }

export const CFRouter = createBrowserRouter([
  {
    path: '/login',
    element: <UserLoginPage />
  },
  {
    path: '/register',
    element: <UserRegisterPage />
  },
  {
    path: '/',
    element: <Navigate to={CFRoutes.HOME} replace />
  },
  {
    element: <RequireAuth />,
    children: [
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
        element: <div>in browser router, caught </div>
      }
    ]
  }
])

export default CFRouter
