import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import * as React from 'react'
import { useContext } from 'react'

const ConnectedUser = ({
  userColour,
  userName
}: {
  userColour: string
  userName: string
}) => {
  return (
    <div
      className="user-indicator"
      style={{
        backgroundColor: userColour
      }}
      title={userName}
    >
      {/*
      this was previously userName[0], so this is likely broken and needs review
      */}
      {userName}
    </div>
  )
}

const ConnectionBar = ({ show }: { show: boolean }) => {
  const context = useContext(WorkFlowConfigContext)

  if (!show) return null

  if (!context.ws.wsConnected) {
    return (
      <div className="users-box connection-failed">{_t('Not Connected')}</div>
    )
  }

  const users = context.ws.connectedUsers.map((user) => {
    return (
      <ConnectedUser userColour={user.userColour} userName={user.userName} />
    )
  })

  // @todo check this again once live for current user
  return (
    <div className="users-box">
      <div className="users-small-wrapper">
        <div className="users-small">{users.slice(0, 2)}</div>
      </div>
      <div className="users-more">...</div>
      <div className="users-hidden">{users}</div>
    </div>
  )
}

export default ConnectionBar
