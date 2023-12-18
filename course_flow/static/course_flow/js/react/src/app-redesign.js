// This file is meant to be a separate entry point for the "redesigned"
// app and a place where all the code will be refactored/consolidated into
// so that we end up with a single entry point into the frontend
import React from 'react'

// https://mui.com/material-ui/react-css-baseline/#scoping-on-children
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import theme from './mui/theme.js'

// required to be able to create a custom cache configuration that
// will work with the provided Django nonce when injecting styles
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

// pages/views/templates

// components
import Sidebar, {
  SidebarRootStyles
} from '@cfCommonComponents/layout/Sidebar.jsx'
import TopBar from '@cfCommonComponents/layout/TopBar.jsx'

// global styles / SCSS
import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'
import { Explore, Home } from '@mui/icons-material'
import Library from '@cfPages/Library/Library/index.jsx'
import LiveAssignment from '@cfPages/Live/LiveAssignment/index.jsx'
import LiveProject from '@cfPages/Live/LiveProject/index.jsx'
import WorkflowComparison from '@cfPages/Workflow/WorkflowComparison/index.jsx'
import WorkflowGrid from '@cfPages/Workflow/WorkflowGrid/index.jsx'
import NotificationsPage from '@cfPages/Notifications/index.jsx'
import ProfileSettingsPage from '@cfPages/ProfileSettings/index.jsx'
import Favourites from '@cfPages/Library/Favorites/index.jsx'

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
console.log('current path')
console.log(COURSEFLOW_APP.path_id)

function Project() {
  return null
}

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
     * LIVE
     *******************************************************/
    case 'assignmentDetail':
      return <LiveAssignment {...COURSEFLOW_APP.contextData} />
    case 'myLiveProjects':
      return <LiveProject {...COURSEFLOW_APP.contextData} />

    /*******************************************************
     * REDUX
     *******************************************************/
    case 'projectComparison':
      /**
       * @todo for myColour, changeFieldID decide whether these should go in
       * the DTO from django, or in a subcomponent, if mot from django, define as explicit props
       */
      const thisContextData = {
        ...COURSEFLOW_APP.contextData,
        myColour:
          'hsl(' + (((DTOcontextData.user_id * 5) % 360) + 1) + ',50%,50%)',
        changeFieldID: Math.floor(Math.random() * 10000)
      }
      // not sure yet because the render method is taking arguments
      return <WorkflowComparison {...thisContextData} />
    case 'workflowDetailView': {
      // not sure yet because the render method is taking arguments
      const workflow_renderer = new Workflow(COURSEFLOW_APP.contextData)
      workflow_renderer.connect()
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
    },
    {
      component: <NotificationsPage />,
      target: '[data-component="notifications-page"]'
    },

    {
      component: <ProfileSettingsPage />,
      target: '[data-component="profile-settings-page"]'
    }
  ]
  renderComponents(componentsToRender)
})
