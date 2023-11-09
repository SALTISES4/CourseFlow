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

// Register all the components that we're loading ourselves on load
window.addEventListener('load', () => {
  renderComponents([
    {
      component: <Sidebar />,
      target: '.main-wrapper [data-component="sidebar"]',
      styles: SidebarRootStyles
    },
    {
      component: <TopBar />,
      target: '.main-wrapper [data-component="topbar"]'
    }
  ])
})
