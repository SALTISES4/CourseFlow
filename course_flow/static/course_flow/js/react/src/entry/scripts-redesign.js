// This file is meant to be a separate entry point for the "redesigned"
// app and a place where all the code will be refactored/consolidated into
// so that we end up with a single entry point into the frontend
import React from 'react'

// https://mui.com/material-ui/react-css-baseline/#scoping-on-children
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../mui/theme.js'

// required to be able to create a custom cache configuration that
// will work with the provided Django nonce when injecting styles
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

// pages/views/templates
import NotificationsPage from '../Components/Pages/Notifications'

// components
import Sidebar, {
  SidebarRootStyles
} from '../Components/components/Layout/Sidebar.jsx'
import TopBar from '../Components/components/Layout/TopBar.jsx'

// create the emotion cache
const cache = createCache({
  key: 'emotion',
  nonce: document.querySelector('#script-redesign').nonce
})

// LIBRARY
import {
  HomeRenderer,
  ExploreRenderer,
  FavouritesRenderer,
  ProjectRenderer,
  LibraryRenderer
} from './scripts-library.js'

// LIVE
import { LiveAssignmentRenderer, LiveProjectRenderer } from './scripts-live.js'
// REDUX
import {
  ComparisonRenderer,
  WorkflowComparisonRenderer,
  WorkflowGridRenderer,
  WorkflowRenderer
} from './scripts-wf-redux.js'

// helper function that wraps each of the components we want to render
// with an accompanying theme provider/css baseline since we're
// progressively adding partials into the existing templates
function renderComponents(components) {
  components.forEach((c) => {
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

// window.contextData
// set in python views and prepped in react_renderer.html
const LibraryComponent = () => {
  switch (COURSEFLOW_APP.path_id) {
    case 'projectDetail':
      return <ProjectRenderer {...COURSEFLOW_APP.contextData} />
    case 'favorites':
      return <FavouritesRenderer />
    case 'library':
      // if this complains about user_id add it to
      // contextData and pass that to LibraryRenderer
      return <LibraryRenderer />
    case 'home':
      return <HomeRenderer {...COURSEFLOW_APP.contextData} />
    case 'explore':
      return <ExploreRenderer {...COURSEFLOW_APP.contextData} />
  }
}

const LiveComponent = () => {
  switch (COURSEFLOW_APP.path_id) {
    case 'assignmentDetail':
      return <LiveAssignmentRenderer {...COURSEFLOW_APP.contextData} />
    case 'myLiveProjects':
      return <LiveProjectRenderer {...COURSEFLOW_APP.contextData} />
  }
}

const ReduxComponent = () => {
  switch (COURSEFLOW_APP.path_id) {
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
      return <ComparisonRenderer {...thisContextData} />
    case 'workflowDetailView': {
      // not sure yet because the render method is taking arguments
      const thisContextData = {
        ...COURSEFLOW_APP.contextData,
        myColour:
          'hsl(' + (((DTOcontextData.user_id * 5) % 360) + 1) + ',50%,50%)',
        changeFieldID: Math.floor(Math.random() * 10000)
      }
      const workflow_renderer = new WorkflowRenderer(thisContextData)
      workflow_renderer.connect()
      return null
    }
    case 'my_live_projects':
      return <WorkflowGridRenderer {...window.contextData} />
  }
}

// Register all the components that we're loading ourselves on load
window.addEventListener('load', () => {
  renderComponents([
    {
      component: <LibraryComponent />,
      target: '#container',
      styles: null
    },
    // {
    //   component: <LiveComponent />,
    //   target: '#container',
    //   styles: null
    // },
    // {
    //   component: <ReduxComponent />,
    //   target: '#container',
    //   styles: null
    // },
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
    }
  ])
})
