// This file is meant to be a separate entry point for the "redesigned"
// app and a place where all the code will be refactored/consolidated into
// so that we end up with a single entry point into the frontend
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

// pages/views/templates
import NotificationsPage from '@cfModule/components/pages/Notifications'
import NotificationsSettingsPage from '@cfModule/components/pages/NotificationsSettings'
import ProfileSettingsPage from '@cfModule/components/pages/ProfileSettings'

// components
import Sidebar, { SidebarRootStyles } from '@cfCommonComponents/layout/Sidebar'
import TopBar from '@cfModule/components/common/layout/TopBar'

// global styles / SCSS
import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

// @WORKFLOW
import WorkflowGrid from '@cfModule/components/pages/Workflow/WorkflowGrid'
import WorkflowComparison from '@cfModule/components/pages/Workflow/WorkflowComparison'
// @LIBRARY
import Project from '@cfModule/components/pages/Library/ProjectDetail'
import Library from '@cfModule/components/pages/Library/Library'
import Favourites from '@cfModule/components/pages/Library/Favorites'
import Home from '@cfModule/components/pages/Library/Home'
import Explore from '@cfModule/components/pages/Library/Explore'
import Workflow from '@cfModule/components/pages/Workflow/Workflow'
import { MouseCursorLoader } from '@cfModule/utility/mouseCursorLoader.js'

// see note in mouseCursorLoader.js
const tinyLoader = new MouseCursorLoader($('body')[0])
COURSEFLOW_APP.tinyLoader = tinyLoader

// create the emotion cache
const cache = createCache({
  key: 'emotion',
  nonce: document.querySelector('#script-redesign').nonce
})

// helper function that wraps each of the components we want to render
// with an accompanying theme provider/css baseline since we're
// progressively adding partials into the existing templates
function renderComponents(components) {
  components.forEach((c) => {
    // hackish check for now since we run this on each page load, but don't necessairly have a component
    // to load into #container
    // see getAppComponent()
    if (!c.component) return

    const target = document.querySelector(c.target)
    if (target) {
      const componentRoot = createRoot(target)
      componentRoot.render(
        <CacheProvider value={cache}>
          <ThemeProvider theme={theme}>
            <ScopedCssBaseline sx={c.styles}>{c.component}</ScopedCssBaseline>
          </ThemeProvider>
        </CacheProvider>
      )
    }
  })
}

/*
  home:  course-flow/home/
  library:  course-flow/mylibrary/
  explore:  course-flow/explore/
  projectDetail:  course-flow/project/1/

  my_live_projects:
  workflowDetailView:
  projectComparison:
 */

// contextData
// set in python views and prepped in react_renderer.html
const getAppComponent = () => {
  switch (COURSEFLOW_APP.path_id) {
    /*******************************************************
     * LIBRARY
     *******************************************************/
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
      return <Project {...COURSEFLOW_APP.contextData} />

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
          'hsl(' + (((DTOcontextData.user_id * 5) % 360) + 1) + ', 50%, 50%)',
        changeFieldID: Math.floor(Math.random() * 10000)
      }
      // not sure yet because the render method is taking arguments
      return <WorkflowComparison {...thisContextData} />
    }
    case 'workflowDetailView': {
      // not sure yet because the render method is taking arguments
      const workflow_renderer = new Workflow(COURSEFLOW_APP.contextData)
      workflow_renderer.init()
      return null
    }
    case 'my_live_projects':
      return <WorkflowGrid {...window.contextData} />
  }
  return null
}

// Register all the components that we're loading ourselves on load
window.addEventListener('load', () => {
  const componentsToRender = [
    {
      component: getAppComponent(),
      target: '#container'
    },
    {
      component: <Sidebar />,
      target: '[data-component="sidebar"]',
      styles: SidebarRootStyles
    },
    {
      component: <TopBar />,
      target: '[data-component="topbar"]'
    }
  ]
  renderComponents(componentsToRender)
})
