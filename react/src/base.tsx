import { OuterContentWrap } from '@cf/mui/helper'
import GlobalDialogs from '@cfComponents/globalNav/GlobalDialogs'
import Sidebar from '@cfComponents/globalNav/Sidebar'
import TopBar from '@cfComponents/globalNav/TopBar'
import Alert from '@cfComponents/UIPrimitives/Alert'
import HtmlReactParser from 'html-react-parser'
import { ReactNode } from 'react'
import * as React from 'react'

type PropsType = {
  showNotifications?: boolean
  children: ReactNode
}

const { appNotifications } = COURSEFLOW_APP.globalContextData

const NotificationsAlert = ({ show }: { show: boolean }) => {
  if (!appNotifications.updateNotifications.id || !show) {
    return <></>
  }
  return (
    <OuterContentWrap sx={{ pb: 0 }}>
      <Alert
        sx={{ mt: 3 }}
        severity="update"
        title={HtmlReactParser(appNotifications.updateNotifications.title)}
        hideIfCookie={`cf-update-${appNotifications.updateNotifications.id}`}
      />
    </OuterContentWrap>
  )
}

const Base = ({ showNotifications, children }: PropsType) => {
  return (
    <>
      <div className="main-wrapper">
        <div data-component="sidebar">
          <Sidebar />
        </div>

        <div className="main-block">
          <div data-component="topbar">
            <TopBar />
            <GlobalDialogs />
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
    </>
  )
}

export default Base
