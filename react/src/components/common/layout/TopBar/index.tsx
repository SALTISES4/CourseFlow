import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import { Link as RouterLink } from 'react-router-dom'
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
import { getNameInitials } from '@cf/utility/utilityFunctions'
import ProjectCreateModal from '@cf/components/common/dialog/ProjectCreate'

import ProgramCreateModal from '@cf/components/common/dialog/ProgramCreate'
import editProgramData from '@cfComponents/dialog/ProgramEdit/data'
import createProgramData from '@cfComponents/dialog/ProgramCreate/data'
import CourseCreateModal from '@cf/components/common/dialog/CourseCreate'
import createCourseData from '@cfComponents/dialog/CourseCreate/data'
import editCourseData from '@cfComponents/dialog/CourseEdit/data'
import ActivityCreateModal from '@cf/components/common/dialog/ActivityCreate'
import editActivityData from '@cfComponents/dialog/ActivityEdit/data'
import createActivityData from '@cfComponents/dialog/ActivityCreate/data'
import PasswordResetModal from '@cf/components/common/dialog/PasswordReset'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'

import {
  TopBarWrap,
  StyledMenu,
  NotificationsMenu,
  NotificationsHeader,
  NotificationsList
} from './styles'
import { TopBarProps } from '@cf/types/common'
import * as React from 'react'
import ReturnLinks from "@cfPages/Workspace/Workflow/WorkflowTabs/components/ReturnLinks";

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
    window.location.replace(COURSEFLOW_APP.globalContextData.path.logout_path)
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
      <MenuItem onClick={() => handleCreateClick(DIALOG_TYPE.PROJECT_CREATE)}>
        {COURSEFLOW_APP.globalContextData.strings.project}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick(DIALOG_TYPE.PROGRAM_CREATE)}>
        {COURSEFLOW_APP.globalContextData.strings.program}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick(DIALOG_TYPE.COURSE_CREATE)}>
        {COURSEFLOW_APP.globalContextData.strings.course}
      </MenuItem>
      <MenuItem onClick={() => handleCreateClick(DIALOG_TYPE.ACTIVITY_CREATE)}>
        {COURSEFLOW_APP.globalContextData.strings.activity}
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
          {COURSEFLOW_APP.globalContextData.strings.notifications}
        </Typography>
        <Link component={RouterLink} to={notifications.url} underline="always">
          {COURSEFLOW_APP.globalContextData.strings.see_all}
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
            <ListItemButton component={RouterLink} to={n.url}>
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
      <MenuItem component={RouterLink} to={menus.account.profileUrl}>
        {COURSEFLOW_APP.globalContextData.strings.profile}
      </MenuItem>
      <MenuItem onClick={() => dispatch(DIALOG_TYPE.PASSWORD_RESET)}>
        {COURSEFLOW_APP.globalContextData.strings.password_reset}
      </MenuItem>
      <MenuItem
        component={RouterLink}
        to={menus.account.notificationsSettingsUrls}
      >
        {COURSEFLOW_APP.globalContextData.strings.notification_settings}
      </MenuItem>
      <Divider />
      <MenuItem component={RouterLink} to={menus.account.daliteUrl}>
        Go to {menus.account.daliteText}
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <LogoutIcon /> {COURSEFLOW_APP.globalContextData.strings.sign_out}
      </MenuItem>
    </StyledMenu>
  )

  const ToolbarWrap = () => {
    return (
      <Toolbar variant="dense">
        <ReturnLinks />
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
    )
  }

  return (
    <TopBarWrap>
      <AppBar position="static">
        <ToolbarWrap />
      </AppBar>

      {/*
        @todo put these menus into the unified menu helper in
        react/src/components/common/menu
        they are already in MUI, so it's fine for now
        // cuts down on a bit of boilerplate
        */}
      {isTeacher && addMenu}
      {notificationsMenu}
      {accountMenu}

      <PasswordResetModal
        onSubmit={() => (window.location.href = menus.account.resetPasswordUrl)}
      />
      <ProjectCreateModal
        showNoProjectsAlert={forms.createProject.showNoProjectsAlert}
        formFields={forms.createProject.formFields}
        disciplines={forms.createProject.disciplines}
      />
      <ProgramCreateModal
        {...createProgramData}
        units={editProgramData.units}
      />
      <CourseCreateModal {...createCourseData} units={editCourseData.units} />
      <ActivityCreateModal
        {...createActivityData}
        units={editActivityData.units}
      />
    </TopBarWrap>
  )
}

export default TopBar
