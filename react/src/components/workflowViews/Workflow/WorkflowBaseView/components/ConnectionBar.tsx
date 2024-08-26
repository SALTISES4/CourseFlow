import * as React from 'react'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
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
      {/*{userName[0]}*/}
      {''}
    </div>
  )
}

// @todo not sure where this goes

//Container for common elements for workflows

type PropsType = {
  user_id: number
  user_name: string
}

const ConnectionBar = () => {
  const context = useContext(WorkFlowConfigContext)

  if (!context.isConnected) {
    return (
      <div className="users-box connection-failed">
        {window.gettext('Not Connected')}
      </div>
    )
  }

  const users = context.isConnected.map((user) => {
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
