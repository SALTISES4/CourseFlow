// @ts-nocheck
// This file is meant to be a separate entry point for the "redesigned"
// app and a place where all the code will be refactored/consolidated into
// so that we end up with a single entry point into the frontend\
import Comparison from '@cfPages/Workflow/Comparison'
import ReactDOM from 'react-dom/client'

/*******************************************************
 * HACK: React's missing key error is adding too much noise to our
 * console, disable TEMPORARILY
 *******************************************************/
const originalConsoleWarn = console.error
console.error = (message, ...args) => {
  if (/unique "key" prop/.test(message)) {
    return
  }
  originalConsoleWarn(message, ...args)
}
/*******************************************************
 * // HACK
 *******************************************************/

import React from 'react'

// https://mui.com/material-ui/react-css-baseline/#scoping-on-children
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import theme from './mui/theme'

// required to be able to create a custom cache configuration that
// will work with the provided Django nonce when injecting styles
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// pages/views/templates
import NotificationsPage from '@cfModule/components/pages/Notifications'
import NotificationsSettingsPage from '@cfModule/components/pages/NotificationsSettings'
import ProfileSettingsPage from '@cfModule/components/pages/ProfileSettings'

// components
import { SidebarRootStyles } from '@cfCommonComponents/layout/Sidebar/styles'

// global styles / SCSS
import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

// React dumb components styleguide page
import Styleguide from '@cfModule/components/pages/Styleguide'
// @WORKFLOW
import WorkflowComparison from '@cfModule/components/pages/Workflow/WorkflowComparison'
// @LIBRARY
import ProjectDetail from '@cfModule/components/pages/Library/ProjectDetail'
import Library from '@cfModule/components/pages/Library/Library'
import Favourites from '@cfModule/components/pages/Library/Favorites'
import Home from '@cfModule/components/pages/Library/Home'
import Explore from '@cfModule/components/pages/Library/Explore'
import Workflow from '@cfModule/components/pages/Workflow/Workflow'
import { MouseCursorLoader } from '@cfModule/utility/mouseCursorLoader.js'
import Base from '@cfModule/base'

// see note in mouseCursorLoader.js
const tinyLoader = new MouseCursorLoader($('body')[0])
COURSEFLOW_APP.tinyLoader = tinyLoader

// create the emotion cache
const cache = createCache({
  key: 'emotion',
  nonce: window.cf_nonce
})

/**
 * contextData
 * set in python views and prepped in react_renderer.html
 */
const getAppComponent = () => {
  switch (COURSEFLOW_APP.path_id) {
    /*******************************************************
     * LIBRARY
     *******************************************************/
    case 'styleguide':
      return <Styleguide />
    case 'home':
      return <Home {...COURSEFLOW_APP.contextData} />
    case 'favorites':
      return <Favourites />
    case 'library':
      // if this complains about user_id add it to
      // contextData and pass that to LibraryRenderer
      return <Library />
    case 'explore':
      return <Explore {...COURSEFLOW_APP.contextData} />
    case 'projectDetail':
      return <ProjectDetail {...COURSEFLOW_APP.contextData} />

    /*******************************************************
     * USER / PROFILE
     *******************************************************/
    case 'notifications':
      return <NotificationsPage {...COURSEFLOW_APP.contextData} />
    case 'notificationsSettings':
      return <NotificationsSettingsPage {...COURSEFLOW_APP.contextData} />
    case 'profileSettings':
      return <ProfileSettingsPage {...COURSEFLOW_APP.contextData} />

    /*******************************************************
     * REDUX
     *******************************************************/
    case 'projectComparison': {
      /**
       * @todo for myColour, changeFieldID decide whether these should go in
       * the DTO from django, or in a subcomponent, if not from django, define as explicit props
       */
      const thisContextData = {
        ...COURSEFLOW_APP.contextData,
        myColour:
          'hsl(' +
          (((COURSEFLOW_APP.contextData.user_id * 5) % 360) + 1) +
          ', 50%, 50%)',
        changeFieldID: Math.floor(Math.random() * 10000)
      }
      // not sure yet because the render method is taking arguments
      const workflowComparisonWrapper = new Comparison(thisContextData)
      workflowComparisonWrapper.render($('#container'))

      return true
    }
    case 'workflowDetailView': {
      const workflowWrapper = new Workflow(COURSEFLOW_APP.contextData)
      workflowWrapper.init()
      return true
    }
  }
  return null
}

// Register all the components that we're loading ourselves on load
// using the event listner is non-standard but we'll keep it since we are using other legact scripts right now (see belpow)
window.addEventListener('load', () => {
  const reactQueryClient = new QueryClient()

  // Delay the execution by 2 seconds
  setTimeout(() => {
    const content = getAppComponent()
    if (!content) return

    const target = document.querySelector('#reactRoot')
    if (target) {
      const componentRoot = createRoot(target)
      componentRoot.render(
        <QueryClientProvider client={reactQueryClient}>
          <CacheProvider value={cache}>
            <ThemeProvider theme={theme}>
              <ScopedCssBaseline sx={SidebarRootStyles}>
                <Base>{content}</Base>
              </ScopedCssBaseline>
            </ThemeProvider>
          </CacheProvider>
        </QueryClientProvider>
      )
    }
  }, 0) // 2000 milliseconds delay
})
