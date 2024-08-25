import { ReactNode } from 'react'
import HtmlReactParser from 'html-react-parser'

import { OuterContentWrap } from '@cfModule/mui/helper'
import Alert from '@cfCommonComponents/UIComponents/Alert'
import TopBar from '@cfCommonComponents/layout/TopBar'
import Sidebar from '@cfCommonComponents/layout/Sidebar'

import { DialogContextProvider } from '@cfModule/components/common/dialog/context'

type PropsType = {
  children: ReactNode
}

const { notifications, sidebar, topbar } = COURSEFLOW_APP.globalContextData

const Base = ({ children }: PropsType) => {
  return (
    <DialogContextProvider>
      <div className="main-wrapper">
        <div data-component="sidebar">
          <Sidebar {...sidebar} />
        </div>

        {/*@todo see https://course-flow.atlassian.net/browse/COUR-246*/}
        <div id="react-portal-left-panel-extra"></div>

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
  )
}

export default Base
