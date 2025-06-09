import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Tooltip from '@mui/material/Tooltip'
import { useContext } from 'react'

function getAvatarInitials(username: string) {
  return username.substring(0, 1)
}

const ConnectionBar = ({ show }: { show: boolean }) => {
  const context = useContext(WorkflowConfigContext)

  if (!show) {
    return null
  }

  if (!context.ws.wsConnected) {
    return <Alert severity="warning">{_t('Not Connected')}</Alert>
  }

  const users = context.ws.connectedUsers.map((item) => (
    <Tooltip
      key={item.user.username}
      arrow
      placement="top"
      title={item.user.username}
    >
      <Avatar
        alt={item.user.username}
        sx={{
          width: 24,
          height: 24,
          border: '2px solid white',
          fontSize: '12px',
          textTransform: 'uppercase',
          backgroundColor: item.userColour
        }}
      >
        {getAvatarInitials(item.user.username)}
      </Avatar>
    </Tooltip>
  ))

  return <AvatarGroup max={2}>{users}</AvatarGroup>
}

export default ConnectionBar
