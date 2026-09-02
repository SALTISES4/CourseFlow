import Base from '@cf/base'
import { CFRoutes, RelativeRoutes } from '@cf/router/cfRoutes'
import UserLoginPage from '@cf/router/LoginPage'
import { RequireAuth } from '@cf/router/RequireAuth'
import { WorkflowRoute } from '@cf/router/WorkflowRoute'
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
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/*******************************************************
 * NOTE:  RR6 drastically altered its approach and no longer robustly supports absolute paths
 * this is a workaround until we finalize a 'pattern'
 * see: https://github.com/remix-run/react-router/discussions/9841
 *******************************************************/

export { CFRoutes, RelativeRoutes }

const RouteFallback = () => {
  const { t } = useTranslation('common')
  return <div>{t('errors.routeFailed')}</div>
}

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
    path: `${CFRoutes.WORKFLOW}/*`,
    element: <WorkflowRoute />
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: CFRoutes.HOME,
        element: (
          <Base>
            <Home />
          </Base>
        )
      },
      {
        path: CFRoutes.FAVORITES,
        element: (
          <Base>
            <Favorites />
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
        path: CFRoutes.PASSWORD_RESET,
        element: (
          <Base>
            <PasswordResetPage />
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
        path: '*',
        element: <RouteFallback />
      }
    ]
  }
])

export default CFRouter
