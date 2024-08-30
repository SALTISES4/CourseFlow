import * as React from 'react'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import { useContext } from 'react'
import { _t } from '@cf/utility/utilityFunctions'

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
      <div className="users-box connection-failed">
        {_t('Not Connected')}
      </div>
    )
  }

  const users = context.ws.connectedUsers.map((user) => {
    return (
      <ConnectedUser userColour={user.user_colour} userName={user.user_name} />
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
