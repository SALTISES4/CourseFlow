import * as React from 'react'
import TopBar from '@cfCommonComponents/layout/TopBar'
import Sidebar from '@cfCommonComponents/layout/Sidebar'
import { ReactNode } from 'react'
type PropsType = {
  children: ReactNode
}
const Base = ({ children }: PropsType) => {
  return (
    <>
      <div className="main-wrapper">
        <div data-component="sidebar">
          <Sidebar/>
        </div>

        {/*@todo see https://course-flow.atlassian.net/browse/COUR-246*/}
        <div id="react-portal-left-panel-extra"></div>

        <div className="main-block">
          <div data-component="topbar">
            <TopBar/>
          </div>

          <div className="topnav hide-print">
            <div className="titlebar">
              <div className="title"></div>
            </div>
            <div id="update-notifications"></div>
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
}

export default Base
