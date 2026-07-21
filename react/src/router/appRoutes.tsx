import Base from '@cf/base'
import { CFRoutes, RelativeRoutes } from '@cf/router/cfRoutes'
import UserLoginPage from '@cf/router/LoginPage'
import { RequireAuth } from '@cf/router/RequireAuth'
import Home from '@cfPages/Home'
import Explore from '@cfPages/Library/Explore'
import Favorites from '@cfPages/Library/Favourites'
import MyLibrary from '@cfPages/Library/MyLibrary'
import NotificationsPage from '@cfPages/Notifications'
import Project from '@cfPages/Project'
import NotificationsSettingsPage from '@cfPages/Settings/NotificationsSettings'
import PasswordResetPage from '@cfPages/Settings/PasswordReset'
import ProfileSettingsPage from '@cfPages/Settings/ProfileSettings'
import UserRegisterPage from '@cfPages/SignIn/Register'
import WorkflowPage from '@cfPages/Workflow'
import { WorkflowViewType } from '@cfPages/Workflow/types'
import { Navigate, createBrowserRouter } from 'react-router-dom'

/*******************************************************
 * NOTE:  RR6 drastically altered its approach and no longer robustly supports absolute paths
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
        path: CFRoutes.FAVORITES,
        element: (
          <Base showNotifications={false}>
            <Favorites />
          </Base>
        )
      },
      {
        path: CFRoutes.LIBRARY,
        element: (
          <Base showNotifications={false}>
            <MyLibrary />
          </Base>
        )
      },
      {
        path: CFRoutes.EXPLORE,
        element: (
          <Base showNotifications={false}>
            <Explore />
          </Base>
        )
      },
      {
        path: CFRoutes.NOTIFICATIONS,
        element: (
          <Base showNotifications={false}>
            <NotificationsPage />
          </Base>
        )
      },
      {
        path: CFRoutes.NOTIFICATIONS_SETTINGS,
        element: (
          <Base showNotifications={false}>
            <NotificationsSettingsPage />
          </Base>
        )
      },
      {
        path: CFRoutes.PROFILE_SETTINGS,
        element: (
          <Base showNotifications={false}>
            <ProfileSettingsPage />
          </Base>
        )
      },
      {
        path: CFRoutes.PASSWORD_RESET,
        element: (
          <Base showNotifications={false}>
            <PasswordResetPage />
          </Base>
        )
      },
      {
        path: `${CFRoutes.PROJECT}/*`,
        element: (
          <Base showNotifications={false}>
            <Project />
          </Base>
        )
      },
      {
        path: `${CFRoutes.WORKFLOW}/*`,
        element: (
          <Base showNotifications={false}>
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
