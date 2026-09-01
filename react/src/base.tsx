import UserProvider from '@cf/context/userContext'
import GlobalDialogs from '@cfComponents/globalNav/GlobalDialogs'
import MainSidebar from '@cfComponents/globalNav/MainSidebar'
import TopBar from '@cfComponents/globalNav/TopBar'
import { ReactNode } from 'react'

import NetworkActivityProvider from './components/common/NetworkActivityProvider'

type PropsType = {
  children: ReactNode
}

const Base = ({ children }: PropsType) => {
  return (
    <UserProvider>
      <div className="main-wrapper">
        <MainSidebar />

        <div className="main-block">
          <TopBar />
          <GlobalDialogs />

          {/* still being used as a portal in comparison view */}
          <div className="titlebar"></div>

          <div className="right-panel-wrapper">
            <div id="container" className="body-wrapper">
              {children}
            </div>
          </div>
        </div>
      </div>
      <NetworkActivityProvider />
    </UserProvider>
  )
}

export default Base
