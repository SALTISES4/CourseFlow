import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { apiPaths } from '@cf/router/apiRoutes'
import { CFRoutes } from '@cf/router/appRoutes'
import strings from '@cf/utility/strings'
import { _t } from '@cf/utility/utilityFunctions'
import { getNameInitials } from '@cf/utility/utilityFunctions'
import ProjectCreateDialog from '@cfComponents/dialog/Project/ProjectCreateDialog'
import PasswordResetDialog from '@cfComponents/dialog/User/PasswordResetDialog'
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
import { useGetNotificationsQuery } from '@XMLHTTP/API/notifications.rtk'
import * as React from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import * as SC from './styles'
const formFields = [
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    value: '',
    required: true
  },
  {
    name: 'description',
    label: 'Description',
    type: 'text',
    value: ''
  }
]

const TopBar = () => {
  const navigate = useNavigate()
  const { dispatch } = useDialog()

  const handleLogout = () => {
    // not sure navigate can handle this
    navigate(apiPaths.external.logout, {
      replace: true
    })
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
        content: strings.project,
        action: () => handleCreateClick(DIALOG_TYPE.PROJECT_CREATE),
        show: true
      },
      {
        content: strings.program,
        action: () => handleCreateClick(DIALOG_TYPE.PROGRAM_CREATE),
        show: true
      },
      {
        content: strings.course,
        action: () => handleCreateClick(DIALOG_TYPE.COURSE_CREATE),
        show: true
      },
      {
        content: strings.activity,
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
        content: strings.profile,
        action: () => navigate(CFRoutes.PROFILE_SETTINGS),
        show: true
      },
      {
        content: strings.password_reset,
        action: () => dispatch(DIALOG_TYPE.PASSWORD_RESET),
        show: true
      },
      {
        content: strings.notification_settings,
        action: () => navigate(CFRoutes.NOTIFICATIONS_SETTINGS),
        show: true,
        seperator: true
      },
      {
        content: `Go to ${apiPaths.external.daliteUrl}`,
        action: () => navigate(apiPaths.external.daliteUrl),
        show: true
      },
      {
        content: strings.sign_out,
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
    const { data, error, isLoading, isError } = useGetNotificationsQuery()

    if (isLoading) return <></>
    if (!data) return <></>

    const content = (
      <>
        <SC.NotificationsHeader>
          <Typography variant="h5">{strings.notifications}</Typography>
          <Link
            component={RouterLink}
            to={CFRoutes.NOTIFICATIONS}
            underline="always"
          >
            {strings.see_all}
          </Link>
        </SC.NotificationsHeader>

        <SC.NotificationsList>
          {data.dataPackage.items.map((item, idx) => (
            <ListItem
              key={idx}
              alignItems="flex-start"
              sx={{
                backgroundColor: item.unread ? 'courseflow.lightest' : null
              }}
            >
              <ListItemButton component={RouterLink} to={item.url}>
                {item.unread && <Badge color="primary" variant="dot" />}
                <ListItemAvatar>
                  <Avatar alt={item.from}>{getNameInitials(item.from)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={item.date}
                  secondary={
                    <Typography
                      sx={{ display: 'inline' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </SC.NotificationsList>
      </>
    )

    const unreadCount = data.dataPackage.meta.unreadCount
    const header: MenuItemType = {
      content: (
        <IconButton
          size="large"
          aria-label={
            unreadCount >= 1
              ? `show ${unreadCount} new notifications`
              : 'no new notifications'
          }
          aria-controls="notifications-menu"
          aria-haspopup="true"
        >
          <Badge badgeContent={unreadCount} color="primary">
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
          <AddMenu show />
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
          (window.location.href = apiPaths.external.resetPasswordUrl)
        }
      />

      <ProjectCreateDialog
        // showNoProjectsAlert={forms.createProject.showNoProjectsAlert}
        //formFields={forms.createProject.formFields}
        showNoProjectsAlert={true}
        formFields={formFields}
      />

      {/*<ProgramCreateDialog*/}
      {/*  {...createProgramData}*/}
      {/*  units={editProgramData.units}*/}
      {/*/>*/}

      {/*<CourseCreateDialog {...createCourseData} units={editCourseData.units} />*/}

      {/*<ActivityCreateDialog*/}
      {/*  {...createActivityData}*/}
      {/*  units={editActivityData.units}*/}
      {/*/>*/}
    </SC.TopBarWrap>
  )
}

export default TopBar
