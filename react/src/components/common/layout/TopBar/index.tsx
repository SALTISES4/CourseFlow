import React, { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Badge from '@mui/material/Badge'
import MenuItem from '@mui/material/MenuItem'
import AccountCircle from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import useApi from '@cfModule/hooks/useApi'

import ResetPasswordModal from './components/ResetPasswordModal'

import {
  TopBarWrap,
  StyledMenu,
  NotificationsMenu,
  NotificationsHeader,
  NotificationsList
} from './styles'
import { getTargetProjectMenu } from '@XMLHTTP/API/project'

type TopBarAPIResponse = {
  is_teacher: boolean
  notifications: {
    url: string
    unread: number
    items: {
      unread: boolean
      url: string
      from: string
      text: string
      date: string
    }[]
  }
  menus: {
    add: {
      projectUrl: string
    }
    account: {
      notificationsSettingsUrls: string
      profileUrl: string
      resetPasswordUrl: string
      daliteUrl: string
      daliteText: string
    }
  }
}

// supported "add" menu actions
type CreateActionType = 'program' | 'activity' | 'course'

function openCreateActionModal(type: CreateActionType) {
  const createUrl = COURSEFLOW_APP.config.create_path[type]
  COURSEFLOW_APP.tinyLoader.startLoad()
  getTargetProjectMenu<{ parentID: number }>(
    -1,
    (response_data) => {
      if (response_data.parentID !== null) {
        window.location.href = createUrl.replace(
          '/0/',
          '/' + response_data.parentID + '/'
        )
      }
    },
    () => {
      COURSEFLOW_APP.tinyLoader.endLoad()
    }
  )
}

const TopBar = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const [resetPassword, setResetPassword] = useState(false)

  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null)
  const isAddMenuOpen = Boolean(addMenuAnchorEl)

  const [notificationsMenuAnchorEl, setNotificationsMenuAnchorEl] =
    useState(null)
  const isNotificationsMenuOpen = Boolean(notificationsMenuAnchorEl)

  const [apiData, loading, error] = useApi<TopBarAPIResponse>(
    COURSEFLOW_APP.config.json_api_paths.get_top_bar
  )

  if (loading || error) {
    return null
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleAddMenuOpen = (event) => {
    setAddMenuAnchorEl(event.currentTarget)
  }

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsMenuAnchorEl(event.currentTarget)
  }

  const handleLogout = () => [
    window.location.replace(COURSEFLOW_APP.config.logout_path)
  ]

  const closeAllMenus = () => {
    setAnchorEl(null)
    setAddMenuAnchorEl(null)
    setNotificationsMenuAnchorEl(null)
  }

  const handleCreateClick = (resourceType: CreateActionType) => {
    openCreateActionModal(resourceType)
    closeAllMenus()
  }

  const addMenu = (
    <StyledMenu
      anchorEl={addMenuAnchorEl}
      id="add-menu"
      keepMounted
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      open={isAddMenuOpen}
      onClose={closeAllMenus}
    >
      <MenuItem component="a" href={apiData.menus.add.projectUrl}>
        {COURSEFLOW_APP.strings.project}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick('program')}>
        {COURSEFLOW_APP.strings.program}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick('course')}>
        {COURSEFLOW_APP.strings.course}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick('activity')}>
        {COURSEFLOW_APP.strings.activity}
      </MenuItem>
    </StyledMenu>
  )

  const notificationsMenu = (
    <NotificationsMenu
      anchorEl={notificationsMenuAnchorEl}
      id="notifications-menu"
      keepMounted
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      open={isNotificationsMenuOpen}
      onClose={closeAllMenus}
    >
      <NotificationsHeader>
        <Typography variant="h5">
          {COURSEFLOW_APP.strings.notifications}
        </Typography>
        <Link href={apiData.notifications.url} underline="always">
          {COURSEFLOW_APP.strings.see_all}
        </Link>
      </NotificationsHeader>

      <NotificationsList>
        {apiData.notifications.items.map((n, idx) => (
          <ListItem
            key={idx}
            alignItems="flex-start"
            sx={{
              backgroundColor: n.unread ? 'courseflow.lightest' : null
            }}
          >
            <ListItemButton component="a" href={n.url}>
              {n.unread && <Badge color="primary" variant="dot" />}
              <ListItemAvatar>
                <Avatar alt={n.from}>
                  {`${n.from.split(' ')[0][0]}${n.from.split(' ')[1][0]}`}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${n.from} • ${n.date}`}
                secondary={
                  <>
                    <Typography
                      sx={{ display: 'inline' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {n.text}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </NotificationsList>
    </NotificationsMenu>
  )

  const accountMenu = (
    <StyledMenu
      anchorEl={anchorEl}
      id="account-menu"
      keepMounted
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      open={isMenuOpen}
      onClose={closeAllMenus}
    >
      <MenuItem component="a" href={apiData.menus.account.profileUrl}>
        {COURSEFLOW_APP.strings.profile}
      </MenuItem>
      <MenuItem onClick={() => setResetPassword(true)}>
        {COURSEFLOW_APP.strings.password_reset}
      </MenuItem>
      <MenuItem
        component="a"
        href={apiData.menus.account.notificationsSettingsUrls}
      >
        {COURSEFLOW_APP.strings.notification_settings}
      </MenuItem>
      <Divider />
      <MenuItem component="a" href={apiData.menus.account.daliteUrl}>
        Go to {apiData.menus.account.daliteText}
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <LogoutIcon /> {COURSEFLOW_APP.strings.sign_out}
      </MenuItem>
    </StyledMenu>
  )

  return (
    <TopBarWrap>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Box sx={{ flexGrow: 1 }} className="title" />
          <Box sx={{ display: 'flex' }}>
            {apiData.is_teacher ? (
              <IconButton
                size="large"
                aria-label="add menu"
                aria-controls="add-menu"
                aria-haspopup="true"
                color="primary"
                onClick={handleAddMenuOpen}
              >
                <AddCircleIcon />
              </IconButton>
            ) : null}

            <IconButton
              size="large"
              aria-label={
                apiData.notifications.unread >= 1
                  ? `show ${apiData.notifications.unread} new notifications`
                  : 'no new notifications'
              }
              aria-controls="notifications-menu"
              aria-haspopup="true"
              onClick={handleNotificationsMenuOpen}
            >
              <Badge
                badgeContent={apiData.notifications.unread}
                color="primary"
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="account-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {apiData.is_teacher && addMenu}
      {notificationsMenu}
      {accountMenu}

      <ResetPasswordModal
        show={resetPassword}
        handleClose={() => {
          setResetPassword(false)
        }}
        handleContinue={() =>
          (window.location.href = apiData.menus.account.resetPasswordUrl)
        }
      />
    </TopBarWrap>
  )
}

export default TopBar
