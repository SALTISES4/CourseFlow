// import './wdyr'

// eslint-disable-next-line import/order
import theme from '@cfMUI/theme'
import '@cf/api/configureCourseFlowClient'
import { courseFlowQueryClient } from '@cf/api/queryClient'
import AuthBootstrap from '@cf/components/auth/AuthBootstrap'
import { CookieProvider } from '@cf/context/cookieContext'
import { DialogContextProvider } from '@cf/context/dialogContext'
import CfRouter from '@cf/router/appRoutes'
import { MainSidebarRootStyles } from '@cfComponents/globalNav/MainSidebar/styles'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'

import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'

import store from './redux/store'

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

// create the emotion cache
const cache = createCache({
  key: 'emotion'
})

const rootElement = document.getElementById('root')
const root = ReactDOM.createRoot(rootElement)

root.render(
  <Provider store={store}>
    <QueryClientProvider client={courseFlowQueryClient}>
      <AuthBootstrap />
      <CookieProvider>
        <CacheProvider value={cache}>
          <SnackbarProvider
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <DialogContextProvider>
              <ThemeProvider theme={theme}>
                <ScopedCssBaseline sx={MainSidebarRootStyles}>
                  <RouterProvider
                    router={CfRouter}
                    future={{ v7_startTransition: true }}
                  />
                </ScopedCssBaseline>
              </ThemeProvider>
            </DialogContextProvider>
          </SnackbarProvider>
        </CacheProvider>
      </CookieProvider>
    </QueryClientProvider>
  </Provider>
)
