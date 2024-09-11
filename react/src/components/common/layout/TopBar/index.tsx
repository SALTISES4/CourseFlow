import ActivityCreateDialog from '@cf/components/common/dialog/common/ActivityCreateDialog'
import CourseCreateDialog from '@cf/components/common/dialog/common/CourseCreateDialog'
import PasswordResetDialog from '@cf/components/common/dialog/common/PasswordResetDialog'
import ProgramCreateDialog from '@cf/components/common/dialog/common/ProgramCreateDialog'
import ProjectCreateDialog from '@cf/components/common/dialog/common/ProjectCreateDialog'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router'
import { TopBarProps } from '@cf/types/common'
import { _t } from '@cf/utility/utilityFunctions'
import { getNameInitials } from '@cf/utility/utilityFunctions'
import createActivityData from '@cfComponents/dialog/common/ActivityCreateDialog/data'
import createCourseData from '@cfComponents/dialog/common/CourseCreateDialog/data'
import createProgramData from '@cfComponents/dialog/common/ProgramCreateDialog/data'
import editActivityData from '@cfComponents/dialog/Workspace/ActivityEditDialog/data'
import editCourseData from '@cfComponents/dialog/Workspace/CourseEditDialog/data'
import editProgramData from '@cfComponents/dialog/Workspace/ProgramEditDialog/data'
import { MenuItemType, SimpleMenu, StaticMenu } from '@cfComponents/menu/Menu'
import ReturnLinks from '@cfPages/Workspace/Workflow/WorkflowTabs/components/ReturnLinks'
import AccountCircle from '@mui/icons-material/AccountCircle'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import * as React from 'react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import * as SC from './styles'

const TopBar = ({ isTeacher, notifications, forms }: TopBarProps) => {
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
        action: () => navigate(CFRoutes.PROFILE_SETTINGS),
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
        action: () => navigate(CFRoutes.NOTIFICATIONS_SETTINGS),
        show: true,
        seperator: true
      },
      {
        content: `Go to ${COURSEFLOW_APP.globalContextData.path.html.account.daliteUrl}`,
        action: () =>
          navigate(
            COURSEFLOW_APP.globalContextData.path.html.account.daliteUrl
          ),
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
      <>
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
      </>
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

      <PasswordResetDialog
        onSubmit={() =>
          (window.location.href =
            COURSEFLOW_APP.globalContextData.path.html.account.resetPasswordUrl)
        }
      />

      <ProjectCreateDialog
        showNoProjectsAlert={forms.createProject.showNoProjectsAlert}
        formFields={forms.createProject.formFields}
      />

      <ProgramCreateDialog
        {...createProgramData}
        units={editProgramData.units}
      />

      <CourseCreateDialog {...createCourseData} units={editCourseData.units} />

      <ActivityCreateDialog
        {...createActivityData}
        units={editActivityData.units}
      />
    </SC.TopBarWrap>
  )
}

export default TopBar
