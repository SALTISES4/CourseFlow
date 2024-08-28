import { ReactNode } from 'react'
import HtmlReactParser from 'html-react-parser'

import { OuterContentWrap } from '@cfModule/mui/helper'
import Alert from '@cfCommonComponents/UIComponents/Alert'
import TopBar from '@cfCommonComponents/layout/TopBar'
import Sidebar from '@cfCommonComponents/layout/Sidebar'

import { DialogContextProvider } from '@cfModule/components/common/dialog/context'
import { configureStore } from '@reduxjs/toolkit'
import * as Reducers from '@cfReducers'
import { Provider } from 'react-redux'

type PropsType = {
  children: ReactNode
}

const { notifications, sidebar, topbar } = COURSEFLOW_APP.globalContextData

const Base = ({ children }: PropsType) => {
  const store = configureStore({
    reducer: Reducers.rootWorkflowReducer,
    // preloadedState: response.data_package,
    devTools: process.env.NODE_ENV !== 'production' // Enable Redux DevTools only in non-production environments
  })

  return (
    <Provider store={store}>
      <DialogContextProvider>
        <div className="main-wrapper">
          <div data-component="sidebar">
            <Sidebar {...sidebar} />
            <div id="react-portal-left-panel-extra"></div>
          </div>

          {/*@todo see https://course-flow.atlassian.net/browse/COUR-246*/}

          <div className="main-block">
            <div data-component="topbar">
              <TopBar {...topbar} />
            </div>

            {COURSEFLOW_APP.path_id === 'home' &&
              notifications.updateNotifications.id && (
                <OuterContentWrap sx={{ pb: 0 }}>
                  <Alert
                    sx={{ mt: 3 }}
                    severity="update"
                    title={HtmlReactParser(
                      notifications.updateNotifications.title
                    )}
                    hideIfCookie={`cf-update-${notifications.updateNotifications.id}`}
                  />
                </OuterContentWrap>
              )}

            <div className="topnav hide-print">
              <div className="titlebar">
                <div className="title"></div>
              </div>
            </div>

            <div className="right-panel-wrapper">
              <div id="container" className="body-wrapper">
                {children}
              </div>
            </div>
          </div>
        </div>

        <div id="popup-container"></div>
      </DialogContextProvider>
    </Provider>
  )
}

export default Base
