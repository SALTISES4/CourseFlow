import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

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

// https://mui.com/material-ui/react-css-baseline/#scoping-on-children
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import theme from './mui/theme'

// required to be able to create a custom cache configuration that
// will work with the provided Django nonce when injecting styles
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// global styles / SCSS
import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

// pages/views/templates
import NotificationsPage from '@cfModule/components/pages/Notifications'
import NotificationsSettingsPage from '@cfModule/components/pages/NotificationsSettings'
import ProfileSettingsPage from '@cfModule/components/pages/ProfileSettings'
// Workflow
// React dumb components styleguide page
import Styleguide from '@cfModule/components/pages/Styleguide'
// @LIBRARY
import ProjectDetail from '@cfModule/components/pages/Library/ProjectDetail'
import Library from '@cfModule/components/pages/Library/Library'
import Favourites from '@cfModule/components/pages/Library/Favourites'
import Home from '@cfModule/components/pages/Library/Home'
import Explore from '@cfModule/components/pages/Library/Explore'
import Workflow from '@cfModule/components/pages/Workflow/Workflow'
import Base from '@cfModule/base'

// components
import { SidebarRootStyles } from '@cfCommonComponents/layout/Sidebar/styles'

// legacy, to remove it
// see note in mouseCursorLoader.js
import { MouseCursorLoader } from '@cfModule/utility/mouseCursorLoader.js'
import WorkflowComparison from '@cfPages/Workflow/WorkflowComparison'
const tinyLoader = new MouseCursorLoader($('body')[0])
// @ts-ignore
COURSEFLOW_APP.tinyLoader = tinyLoader

const domain = 'course-flow'
// create the emotion cache
const cache = createCache({
  key: 'emotion',
  nonce: window.cf_nonce
})

const router = createBrowserRouter([
  {
    path: `${domain}/home`,
    element: (
      <Base>
        {' '}
        <Home />
      </Base>
    )
  },
  {
    path: `${domain}/styleguide`,
    element: (
      <Base>
        {' '}
        <Styleguide />
      </Base>
    )
  },
  {
    path: `${domain}/favourites`,
    element: (
      <Base>
        <Favourites />
      </Base>
    )
  },
  {
    path: `${domain}/library`,
    element: (
      <Base>
        {' '}
        <Library />
      </Base>
    )
  },
  {
    path: `${domain}/explore`,
    element: (
      <Base>
        <Explore />
      </Base>
    )
  },
  {
    path: `${domain}/user/notifications`,
    element: (
      <Base>
        <NotificationsPage />
      </Base>
    )
  },
  {
    path: `${domain}/user/notifications-settings`,
    element: (
      <Base>
        {' '}
        <NotificationsSettingsPage />
      </Base>
    )
  },
  {
    path: `${domain}/user/profile-settings`,
    element: (
      <Base>
        <ProfileSettingsPage />
      </Base>
    )
  },
  {
    path: `${domain}/project/:id/comparison`,
    element: (
      <Base>
        {' '}
        <WorkflowComparison />
      </Base>
    )
  },
  {
    path: `${domain}/project/:id`,
    element: (
      <Base>
        <ProjectDetail />
      </Base>
    )
  },
  {
    path: `${domain}/workflow/:id`,
    element: (
      <Base>
        <Workflow />
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
