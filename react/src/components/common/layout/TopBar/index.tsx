import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Badge from '@mui/material/Badge'
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

import * as SC from './styles'
import { TopBarProps } from '@cf/types/common'
import * as React from 'react'
import ReturnLinks from '@cfPages/Workspace/Workflow/WorkflowTabs/components/ReturnLinks'
import { MenuItemType, SimpleMenu, StaticMenu } from '@cfComponents/menu/Menu'

const TopBar = ({ isTeacher, menus, notifications, forms }: TopBarProps) => {
  const navigate = useNavigate()
  const { dispatch } = useDialog()

  const [notificationsMenuAnchorEl, setNotificationsMenuAnchorEl] =
    useState(null)
  const isNotificationsMenuOpen = Boolean(notificationsMenuAnchorEl)

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsMenuAnchorEl(event.currentTarget)
  }

  const handleLogout = () => {
    // not sure navigate can handle this
    navigate(COURSEFLOW_APP.globalContextData.path.logout_path, {
      replace: true
    })
  }

  const closeAllMenus = () => {
    setNotificationsMenuAnchorEl(null)
  }

  const handleCreateClick = (resourceType: DIALOG_TYPE) => {
    dispatch(resourceType)
  }

  /*******************************************************
   * MENUS
   *******************************************************/
  const AddMenu = ({ show }: { show: boolean }) => {
    if (!show) return

    const header: MenuItemType = {
      content: (
        <IconButton
          aria-label="add menu"
          aria-controls="add-menu"
          aria-haspopup="true"
          color="primary"
        >
          <AddCircleIcon />
        </IconButton>
      ),
      show: true
    }
    const menuItems: MenuItemType[] = [
      {
        content: _t(COURSEFLOW_APP.globalContextData.strings.project),
        action: () => handleCreateClick(DIALOG_TYPE.PROJECT_CREATE),
        show: true
      },
      {
        content: _t(COURSEFLOW_APP.globalContextData.strings.program),
        action: () => handleCreateClick(DIALOG_TYPE.PROGRAM_CREATE),
        show: true
      },
      {
        content: _t(COURSEFLOW_APP.globalContextData.strings.course),
        action: () => handleCreateClick(DIALOG_TYPE.COURSE_CREATE),
        show: true
      },
      {
        content: _t(COURSEFLOW_APP.globalContextData.strings.activity),
        action: () => handleCreateClick(DIALOG_TYPE.ACTIVITY_CREATE),
        show: true
      }
    ]
    return <SimpleMenu id={'add-menu'} header={header} menuItems={menuItems} />
  }

  const AccountMenu = () => {
    const header: MenuItemType = {
      content: (
        <IconButton
          aria-label="account of current user"
          aria-controls="account-menu"
          aria-haspopup="true"
        >
          <AccountCircle />
        </IconButton>
      ),
      show: true
    }
    const menuItems: MenuItemType[] = [
      {
        content: _t(COURSEFLOW_APP.globalContextData.strings.profile),
        action: () => navigate(menus.account.profileUrl),
        show: true
      },
      {
        content: _t(COURSEFLOW_APP.globalContextData.strings.password_reset),
        action: () => dispatch(DIALOG_TYPE.PASSWORD_RESET),
        show: true
      },
      {
        content: _t(
          COURSEFLOW_APP.globalContextData.strings.notification_settings
        ),
        action: () => navigate(menus.account.notificationsSettingsUrls),
        show: true,
        seperator: true
      },
      {
        content: `Go to ${menus.account.daliteText}`,
        action: () => navigate(menus.account.daliteUrl),
        show: true
      },
      {
        content: _t(COURSEFLOW_APP.globalContextData.strings.sign_out),
        action: handleLogout,
        icon: <LogoutIcon />,
        showIconInList: true,
        show: true
      }
    ]
    return (
      <SimpleMenu id={'account-menu'} header={header} menuItems={menuItems} />
    )
  }

  const NotificationsMenu = () => {
    const content = (
      <SC.NotificationsMenu
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
        <SC.NotificationsHeader>
          <Typography variant="h5">
            {COURSEFLOW_APP.globalContextData.strings.notifications}
          </Typography>
          <Link
            component={RouterLink}
            to={notifications.url}
            underline="always"
          >
            {COURSEFLOW_APP.globalContextData.strings.see_all}
          </Link>
        </SC.NotificationsHeader>

        <SC.NotificationsList>
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
        </SC.NotificationsList>
      </SC.NotificationsMenu>
    )

    const header: MenuItemType = {
      content: (
        <IconButton
          size="large"
          aria-label={
            notifications.unread >= 1
              ? `show ${notifications.unread} new notifications`
              : 'no new notifications'
          }
          aria-controls="notifications-menu"
          aria-haspopup="true"
        >
          <Badge badgeContent={notifications.unread} color="primary">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      ),
      show: true
    }

    return (
      <StaticMenu
        id="notificationsMenu-menu"
        header={header}
        content={content}
      />
    )
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const ToolbarWrap = () => {
    return (
      <Toolbar variant="dense">
        <ReturnLinks />
        <Box sx={{ flexGrow: 1 }} className="title" />
        <Box sx={{ display: 'flex' }}>
          <AddMenu show={isTeacher} />
          <NotificationsMenu />
          <AccountMenu />
        </Box>
      </Toolbar>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <SC.TopBarWrap>
      <AppBar position="static">
        <ToolbarWrap />
      </AppBar>

      {/*
        @todo put these menus into the unified menu helper in
        react/src/components/common/menu
        they are already in MUI, so it's fine for now
        // cuts down on a bit of boilerplate
        */}

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
    </SC.TopBarWrap>
  )
}

export default TopBar
