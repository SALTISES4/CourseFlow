import { ReactNode } from 'react'
import HtmlReactParser from 'html-react-parser'

import { OuterContentWrap } from '@cfModule/mui/helper'
import Alert from '@cfCommonComponents/components/Alert'
import TopBar from '@cfCommonComponents/layout/TopBar'
import Sidebar from '@cfCommonComponents/layout/Sidebar'

type PropsType = {
  children: ReactNode
}

const Base = ({ children }: PropsType) => (
  <>
    <div className="main-wrapper">
      <div data-component="sidebar">
        <Sidebar />
      </div>

      {/*@todo see https://course-flow.atlassian.net/browse/COUR-246*/}
      <div id="react-portal-left-panel-extra"></div>

      <div className="main-block">
        <div data-component="topbar">
          <TopBar />
        </div>

        {COURSEFLOW_APP.update_notifications.id && (
          <OuterContentWrap sx={{ pb: 0 }}>
            <Alert
              sx={{ mt: 3 }}
              severity="update"
              title={HtmlReactParser(COURSEFLOW_APP.update_notifications.title)}
              hideIfCookie={`cf-update-${COURSEFLOW_APP.update_notifications.id}`}
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
  </>
)

export default Base
