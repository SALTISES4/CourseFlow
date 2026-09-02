import { useTranslation } from 'react-i18next'

const ConnectionBar = ({ show }: { show: boolean }) => {
  const { t } = useTranslation('workflow')
  // if (!show) {
  //   return null
  // }
  //
  // if (!context.ws.wsConnected) {
  //   return (
  //     <Tooltip arrow placement="top" title={t('menu.notConnected')}>
  //       <WarningIcon
  //         sx={{
  //           verticalAlign: 'center',
  //           color: 'warning.main'
  //         }}
  //       />
  //     </Tooltip>
  //   )
  // }

  // const users = context.ws.connectedUsers.map((item) => (
  //   <Tooltip
  //     key={item.user.username}
  //     arrow
  //     placement="top"
  //     title={item.user.username}
  //   >
  //     <Avatar
  //       alt={item.user.username}
  //       sx={{
  //         width: 24,
  //         height: 24,
  //         border: '2px solid white',
  //         fontSize: '12px',
  //         textTransform: 'uppercase',
  //         backgroundColor: item.userColour
  //       }}
  //     >
  //       {getAvatarInitials(item.user.username)}
  //     </Avatar>
  //   </Tooltip>
  // ))

  // return <AvatarGroup max={2}>{users}</AvatarGroup>
  return show ? <>{t('menu.onlineUsers')}</> : null
}

export default ConnectionBar
