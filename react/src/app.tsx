// import './wdyr'
import createCache from '@emotion/cache'
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import '@cfSCSS/base_style.scss'
import '@cfSCSS/workflow_styles.scss'
import CfRouter from '@cf/router/appRoutes'
import { CookieProvider } from '@cf/context/cookieContext'
import { DialogContextProvider } from '@cf/context/dialogContext'
import UserProvider from '@cf/context/userContext'
import { SidebarRootStyles } from '@cfComponents/globalNav/Sidebar/styles'
import { CacheProvider } from '@emotion/react'

import theme from './mui/theme'
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
  key: 'emotion',
  nonce: window.cf_nonce
})

const rootElement = document.getElementById('root')
const root = ReactDOM.createRoot(rootElement)

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
                  <RouterProvider
                    router={CfRouter}
                    future={{ v7_startTransition: true }}
                  />
                </ScopedCssBaseline>
              </ThemeProvider>
            </UserProvider>
          </DialogContextProvider>
        </SnackbarProvider>
      </CacheProvider>
    </CookieProvider>
  </Provider>
)
