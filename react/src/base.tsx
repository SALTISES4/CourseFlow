import { DialogContextProvider } from '@cf/context/dialogContext'
import { OuterContentWrap } from '@cf/mui/helper'
import Sidebar from '@cfComponents/layout/Sidebar'
import TopBar from '@cfComponents/layout/TopBar'
import Alert from '@cfComponents/UIPrimitives/Alert'
import * as Reducers from '@cfRedux/Reducers'
import { configureStore } from '@reduxjs/toolkit'
import HtmlReactParser from 'html-react-parser'
import React, { ReactNode } from 'react'
import { Provider } from 'react-redux'

type PropsType = {
  showNotifications?: boolean
  children: ReactNode
}

const { notifications, sidebar, topbar } = COURSEFLOW_APP.globalContextData

const NotificationsAlert = ({ show }: { show: boolean }) => {
  if (!notifications.updateNotifications.id || !show) {
    return <></>
  }
  return (
    <OuterContentWrap sx={{ pb: 0 }}>
      <Alert
        sx={{ mt: 3 }}
        severity="update"
        title={HtmlReactParser(notifications.updateNotifications.title)}
        hideIfCookie={`cf-update-${notifications.updateNotifications.id}`}
      />
    </OuterContentWrap>
  )
}

const Base = ({ showNotifications, children }: PropsType) => {
  const store = configureStore({
    reducer: Reducers.rootWorkflowReducer,
    devTools: process.env.NODE_ENV !== 'production' // Enable Redux DevTools only in non-production environments
  })

  return (
    <Provider store={store}>
      <div className="main-wrapper">
        <div data-component="sidebar">
          <Sidebar {...sidebar} />
        </div>

        <div className="main-block">
          <div data-component="topbar">
            <TopBar {...topbar} />
          </div>

          <NotificationsAlert show={showNotifications} />

          {/* still being used as a portal in comparison view  */}
          <div className="titlebar"></div>

          <div className="right-panel-wrapper">
            <div id="container" className="body-wrapper">
              {children}
            </div>
          </div>
        </div>
      </div>

      <div id="popup-container"></div>
    </Provider>
  )
}

export default Base
