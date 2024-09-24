import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { configureStore } from '@reduxjs/toolkit'
import { cfApi } from '@XMLHTTP/API/api'
import { SnackbarProvider } from 'notistack'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'

import theme from './mui/theme'

import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'
import CfRouter from '@cf/router/appRoutes'
import { MouseCursorLoader } from '@cf/utility/mouseCursorLoader.js'
import { CookieProvider } from '@cf/context/cookieContext'
import { DialogContextProvider } from '@cf/context/dialogContext'
import UserProvider from '@cf/context/userContext'
import { rootWorkflowReducers } from '@cfRedux/Reducers'
import { SidebarRootStyles } from '@cfComponents/globalNav/Sidebar/styles'

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
const store = configureStore({
  reducer: {
    // workflow: Reducers.rootWorkflowReducer,
    // outcome: Reducers.rootOutcomeReducer,
    ...rootWorkflowReducers,
    [cfApi.reducerPath]: cfApi.reducer
  },
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools only in non-production environments
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cfApi.middleware)
})

root.render(
  <Provider store={store}>
    <CookieProvider>
      <CacheProvider value={cache}>
        <SnackbarProvider
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <DialogContextProvider>
            <UserProvider>
              <ThemeProvider theme={theme}>
                <ScopedCssBaseline sx={SidebarRootStyles}>
                  <RouterProvider router={CfRouter} />
                </ScopedCssBaseline>
              </ThemeProvider>
            </UserProvider>
          </DialogContextProvider>
        </SnackbarProvider>
      </CacheProvider>
    </CookieProvider>
  </Provider>
)
