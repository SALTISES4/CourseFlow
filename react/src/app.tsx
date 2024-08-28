import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
/*******************************************************
 * HACK: React's missing key error is adding too much noise to our
 * console, disable TEMPORARILY
 *******************************************************/
const originalConsoleWarn = console.error
console.error = (message, ...args) => {
  // temp do not leave in
  if (/unique "key" prop/.test(message)) {
    return
  }

  // temp do not leave in
  if (/Warning/.test(message)) {
    return
  }
  // temp do not leave in
  if (/Cannot read properties of null/.test(message)) {
    return
  }
  originalConsoleWarn(message, ...args)
}
/*******************************************************
 * // HACK
 *******************************************************/

// Theme  and CSS
// https://mui.com/material-ui/react-css-baseline/#scoping-on-children
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import theme from './mui/theme'
// required to be able to create a custom cache configuration that
// will work with the provided Django nonce when injecting styles
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
// global styles / SCSS
import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'
import { SidebarRootStyles } from '@cfCommonComponents/layout/Sidebar/styles'

// pages
import NotificationsPage from '@cfModule/components/pages/Notifications'
import NotificationsSettingsPage from '@cfModule/components/pages/NotificationsSettings'
import ProfileSettingsPage from '@cfModule/components/pages/ProfileSettings'
import Styleguide from '@cfModule/components/pages/Styleguide'
import ProjectDetail from '@cfModule/components/pages/ProjectDetail'
import Library from '@cfModule/components/pages/Library/Library'
import Favourites from '@cfModule/components/pages/Library/Favourites'
import Home from '@cfModule/components/pages/Library/Home'
import Explore from '@cfModule/components/pages/Library/Explore'
import Base from '@cfModule/base'

// @todo:
// legacy, to remove it
// see note in mouseCursorLoader.js
// we don't want t a mouse loader at all, but the placeholder calls are useful currently
import { MouseCursorLoader } from '@cfModule/utility/mouseCursorLoader.js'
import WorkflowComparison from '@cfPages/Workspace/ProjectComparison'
import WorkflowPage from '@cfPages/Workspace/Workflow'
const tinyLoader = new MouseCursorLoader($('body')[0])
// @ts-ignore
COURSEFLOW_APP.tinyLoader = tinyLoader

const DOMAIN = 'course-flow'
// create the emotion cache
const cache = createCache({
  key: 'emotion',
  nonce: window.cf_nonce
})

const router = createBrowserRouter([
  {
    path: `${DOMAIN}/home`,
    element: (
      <Base>
        <Home />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/styleguide`,
    element: (
      <Base>
        <Styleguide />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/favourites`,
    element: (
      <Base>
        <Favourites />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/library`,
    element: (
      <Base>
        <Library />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/explore`,
    element: (
      <Base>
        <Explore />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/user/notifications`,
    element: (
      <Base>
        <NotificationsPage />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/user/notifications-settings`,
    element: (
      <Base>
        <NotificationsSettingsPage />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/user/profile-settings`,
    element: (
      <Base>
        <ProfileSettingsPage />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/project/:id/comparison`,
    element: (
      <Base>
        {/* @ts-ignore something to do with the legacy router HOC, don't think it's worth it to fix*/}
        <WorkflowComparison />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/project/:id`,
    element: (
      <Base>
        <ProjectDetail />
      </Base>
    )
  },
  {
    path: `${DOMAIN}/workflow/:id`,
    element: (
      <Base>
        <WorkflowPage />
      </Base>
    )
  },
  {
    path: '*',
    element: <div>in browser router, caught </div>
  }
])

const rootElement = document.getElementById('root')
const root = ReactDOM.createRoot(rootElement)
const reactQueryClient = new QueryClient()

root.render(
  <QueryClientProvider client={reactQueryClient}>
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <ScopedCssBaseline sx={SidebarRootStyles}>
          <RouterProvider router={router} />
        </ScopedCssBaseline>
      </ThemeProvider>
    </CacheProvider>
  </QueryClientProvider>
)
