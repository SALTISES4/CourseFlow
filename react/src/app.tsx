import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import theme from './mui/theme'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'
import { SidebarRootStyles } from '@cfComponents/layout/Sidebar/styles'
import { MouseCursorLoader } from '@cf/utility/mouseCursorLoader.js'
import CfRouter from '@cf/router'

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

// @todo:
// legacy, to remove it
// see note in mouseCursorLoader.js
// we don't want t a mouse loader at all, but the placeholder calls are useful currently

const tinyLoader = new MouseCursorLoader($('body')[0])
// @ts-ignore
COURSEFLOW_APP.tinyLoader = tinyLoader

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
