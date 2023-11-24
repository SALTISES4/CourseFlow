import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Badge from '@mui/material/Badge'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import AccountCircle from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import useApi from '../../../hooks/useApi'

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    minWidth: 220,
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        marginRight: theme.spacing(1.5)
      }
    }
  }
}))

const NotificationsMenu = styled(Popover)({
  '& .MuiPaper-root': {
    marginLeft: '3em',
    width: 500
  }
})

const NotificationsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTypography-root:not(a)': {
    color: 'currentColor'
  }
}))

const NotificationsList = styled(List)(({ theme }) => ({
  paddingTop: 0,
  paddingBottom: 0,
  marginBottom: theme.spacing(1),
  '& .MuiListItem-root': {
    padding: 0
  },
  '& .MuiListItemButton-root': {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(4),
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  '& .MuiBadge-root': {
    position: 'absolute',
    left: theme.spacing(1.7),
    top: '50%'
  }
}))

const TopBar = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null)
  const isAddMenuOpen = Boolean(addMenuAnchorEl)

  const [notificationsMenuAnchorEl, setNotificationsMenuAnchorEl] =
    useState(null)
  const isNotificationsMenuOpen = Boolean(notificationsMenuAnchorEl)

  const [apiData, loading, error] = useApi(config.json_api_paths.get_top_bar)

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

  const handleLogout = () => [window.location.replace(config.logout_path)]

  const closeAllMenus = () => {
    setAnchorEl(null)
    setAddMenuAnchorEl(null)
    setNotificationsMenuAnchorEl(null)
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
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.program}
      </MenuItem>
      <MenuItem onClick={closeAllMenus}>
        {COURSEFLOW_APP.strings.course}
      </MenuItem>
      <MenuItem onClick={closeAllMenus}>
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
              backgroundColor: n.unread ? 'primary.lightest' : null
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
      <MenuItem component="a" href={apiData.menus.account.resetPasswordUrl}>
        {COURSEFLOW_APP.strings.password_reset}
      </MenuItem>
      <MenuItem component="a" href={apiData.menus.account.profileUrl}>
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
    <Box>
      <AppBar position="static">
        <Paper>
          <Toolbar variant="dense">
            <Box sx={{ flexGrow: 1 }} />
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
        </Paper>
      </AppBar>
      {apiData.is_teacher && addMenu}
      {notificationsMenu}
      {accountMenu}
    </Box>
  )
}

export default TopBar
