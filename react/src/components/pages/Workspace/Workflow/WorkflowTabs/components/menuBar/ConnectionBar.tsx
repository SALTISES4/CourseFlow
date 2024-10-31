import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import * as React from 'react'
import { useContext } from 'react'

const ConnectedUser = ({
  userColour,
  username
}: {
  userColour: string
  username: string
}) => {
  return (
    <Chip
      style={{
        backgroundColor: userColour
      }}
      label={username}
    />
  )
}

const ConnectionBar = ({ show }: { show: boolean }) => {
  const context = useContext(WorkflowConfigContext)

  if (!show) {
    return null
  }

  if (!context.ws.wsConnected) {
    return <Alert severity="warning">{_t('Not Connected')}</Alert>
  }

  const users = context.ws.connectedUsers.map((item) => {
    return (
      <ConnectedUser
        userColour={item.userColour}
        username={item.user.username}
      />
    )
  })

  return <div>{users}</div>
}

export default ConnectionBar
