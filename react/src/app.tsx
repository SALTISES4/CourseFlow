import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

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

// @todo:
// legacy, to remove it
// see note in mouseCursorLoader.js
// we don't want t a mouse loader at all, but the placeholder calls are useful currently
import { MouseCursorLoader } from '@cfModule/utility/mouseCursorLoader.js'
const tinyLoader = new MouseCursorLoader($('body')[0])
// @ts-ignore
COURSEFLOW_APP.tinyLoader = tinyLoader

import CfRouter from '@cf/router'
// create the emotion cache
const cache = createCache({
  key: 'emotion',
  nonce: window.cf_nonce
})

const rootElement = document.getElementById('root')
const root = ReactDOM.createRoot(rootElement)
const reactQueryClient = new QueryClient()

root.render(
  <QueryClientProvider client={reactQueryClient}>
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <ScopedCssBaseline sx={SidebarRootStyles}>
          <RouterProvider router={CfRouter} />
        </ScopedCssBaseline>
      </ThemeProvider>
    </CacheProvider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
)
