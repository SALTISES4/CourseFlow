// This file is meant to be a separate entry point for the "redesigned"
// app and a place where all the code will be refactored/consolidated into
// so that we end up with a single entry point into the frontend
import React from 'react'

// https://mui.com/material-ui/react-css-baseline/#scoping-on-children
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'

// required to be able to create a custom cache configuration that
// will work with the provided Django nonce when injecting styles
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'

// components
import Sidebar from '../Components/components/Layout/Sidebar.jsx'

// create the emotion cache
const cache = createCache({
  key: 'emotion',
  nonce: document.querySelector('#script-redesign').nonce
})

// create the MUI theme
// TODO: move this out potentially
const theme = createTheme({
  palette: {
    success: {
      main: '#ae0094'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        root: ({ theme }) => {
          color: theme.palette.success.main
        }
      }
    }
  }
})

// helper function that wraps each of the components we want to render
// with an accompanying theme provider/css baseline since we're
// progressively adding partials into the existing templates
// TODO: cleanup this - injects providers for each component separately
function renderComponentIntoNode(component, node) {
  const target = document.querySelector(node)
  if (target) {
    const componentRoot = createRoot(target)
    componentRoot.render(
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <ScopedCssBaseline>{component}</ScopedCssBaseline>
        </ThemeProvider>
      </CacheProvider>
    )
  }
}

// Register all the components that we're loading ourselves on load
window.addEventListener('load', () => {
  renderComponentIntoNode(
    <Sidebar />,
    '.main-wrapper [data-component="sidebar"]'
  )
})
