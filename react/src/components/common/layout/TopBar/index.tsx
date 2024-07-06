import { useState } from 'react'
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
import { getNameInitials } from '@cfModule/utility/utilityFunctions'
import CreateProgramModal from '@cfModule/components/common/dialog/CreateProgram'
import CreateProjectModal from '@cfModule/components/common/dialog/CreateProject'
import CreateCourseModal from '@cfModule/components/common/dialog/CreateCourse'
import CreateActivityModal from '@cfModule/components/common/dialog/CreateActivity'
import ResetPasswordModal from '@cfModule/components/common/dialog/ResetPassword'
import LinkWorkflowModal from '@cfModule/components/common/dialog/LinkWorkflow'
import { DIALOG_TYPE, useDialog } from '@cfModule/components/common/dialog'

import {
  TopBarWrap,
  StyledMenu,
  NotificationsMenu,
  NotificationsHeader,
  NotificationsList
} from './styles'
import { getTargetProjectMenu } from '@XMLHTTP/API/workflow'
import { TopBarProps } from '@cfModule/types/common'

// TODO: clean up and move into create modals functionality
function openCreateActionModal(type: 'program' | 'activity' | 'course') {
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

const TopBar = ({ isTeacher, menus, notifications, forms }: TopBarProps) => {
  const { dispatch } = useDialog()
  const [anchorEl, setAnchorEl] = useState(null)
  const isMenuOpen = Boolean(anchorEl)

  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null)
  const isAddMenuOpen = Boolean(addMenuAnchorEl)

  const [notificationsMenuAnchorEl, setNotificationsMenuAnchorEl] =
    useState(null)
  const isNotificationsMenuOpen = Boolean(notificationsMenuAnchorEl)

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

  const handleCreateClick = (resourceType: DIALOG_TYPE) => {
    closeAllMenus()
    dispatch(resourceType)
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
      <MenuItem onClick={() => handleCreateClick(DIALOG_TYPE.CREATE_PROJECT)}>
        {COURSEFLOW_APP.strings.project}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick(DIALOG_TYPE.CREATE_PROGRAM)}>
        {COURSEFLOW_APP.strings.program}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick(DIALOG_TYPE.CREATE_COURSE)}>
        {COURSEFLOW_APP.strings.course}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick(DIALOG_TYPE.CREATE_ACTIVITY)}>
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
        <Link href={notifications.url} underline="always">
          {COURSEFLOW_APP.strings.see_all}
        </Link>
      </NotificationsHeader>

      <NotificationsList>
        {notifications.items.map((n, idx) => (
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
                <Avatar alt={n.from}>{getNameInitials(n.from)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={n.date}
                secondary={
                  <Typography
                    sx={{ display: 'inline' }}
                    component="span"
                    variant="body2"
                    color="text.primary"
                  >
                    {n.text}
                  </Typography>
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
      <MenuItem component="a" href={menus.account.profileUrl}>
        {COURSEFLOW_APP.strings.profile}
      </MenuItem>
      <MenuItem onClick={() => dispatch(DIALOG_TYPE.RESET_PASSWORD)}>
        {COURSEFLOW_APP.strings.password_reset}
      </MenuItem>
      <MenuItem component="a" href={menus.account.notificationsSettingsUrls}>
        {COURSEFLOW_APP.strings.notification_settings}
      </MenuItem>
      <Divider />
      <MenuItem component="a" href={menus.account.daliteUrl}>
        Go to {menus.account.daliteText}
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
            {isTeacher ? (
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
                notifications.unread >= 1
                  ? `show ${notifications.unread} new notifications`
                  : 'no new notifications'
              }
              aria-controls="notifications-menu"
              aria-haspopup="true"
              onClick={handleNotificationsMenuOpen}
            >
              <Badge badgeContent={notifications.unread} color="primary">
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
      {isTeacher && addMenu}
      {notificationsMenu}
      {accountMenu}

      <ResetPasswordModal
        onSubmit={() => (window.location.href = menus.account.resetPasswordUrl)}
      />
      <CreateProjectModal
        showNoProjectsAlert={forms.createProject.showNoProjectsAlert}
        formFields={forms.createProject.formFields}
      />
      <CreateProgramModal />
      <CreateCourseModal />
      <CreateActivityModal />
    </TopBarWrap>
  )
}

export default TopBar
