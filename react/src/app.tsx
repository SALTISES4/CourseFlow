// import './wdyr'

// eslint-disable-next-line import/order
import { createCourseFlowTheme } from '@cfMUI/theme' // if theme is moved down, app will break from circ deps

import '@cf/api/configureCourseFlowClient'
import { courseFlowQueryClient } from '@cf/api/queryClient'
import AuthBootstrap from '@cf/components/auth/AuthBootstrap'
import { CookieProvider } from '@cf/context/cookieContext'
import { DialogContextProvider } from '@cf/context/dialogContext'
import '@cf/i18n'
import { normalizeLocale } from '@cf/i18n/config'
import CfRouter from '@cf/router/appRoutes'
import { MainSidebarRootStyles } from '@cfComponents/globalNav/MainSidebar/styles'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import ScopedCssBaseline from '@mui/material/ScopedCssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import {
  enUS as datePickerEnUS,
  frFR as datePickerFrFR
} from '@mui/x-date-pickers/locales'
import { QueryClientProvider } from '@tanstack/react-query'
import { enCA, frCA } from 'date-fns/locale'
import { SnackbarProvider } from 'notistack'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
if (!rootElement) {
  throw new Error('Root element "#root" was not found')
}
const root = ReactDOM.createRoot(rootElement)

const datePickerLocaleText = {
  'en-CA': datePickerEnUS.components.MuiLocalizationProvider.defaultProps.localeText,
  'fr-CA': datePickerFrFR.components.MuiLocalizationProvider.defaultProps.localeText
} as const

function LocalizedApplication() {
  const { i18n } = useTranslation()
  const locale = normalizeLocale(i18n.resolvedLanguage)
  const theme = useMemo(() => createCourseFlowTheme(locale), [locale])
  const adapterLocale = locale === 'fr-CA' ? frCA : enCA

  return (
    <QueryClientProvider client={courseFlowQueryClient}>
      <AuthBootstrap />
      <CookieProvider>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={adapterLocale}
          localeText={datePickerLocaleText[locale]}
        >
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
        </LocalizationProvider>
      </CookieProvider>
    </QueryClientProvider>
  )
}

root.render(
  <Provider store={store}>
    <LocalizedApplication />
  </Provider>
)
