import { OuterContentWrap } from '@cf/mui/helper'
import Sidebar from '@cfComponents/layout/Sidebar'
import TopBar from '@cfComponents/layout/TopBar'
import Alert from '@cfComponents/UIPrimitives/Alert'
import HtmlReactParser from 'html-react-parser'
import { ReactNode } from 'react'

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
  return (
    <>
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
    </>
  )
}

export default Base
