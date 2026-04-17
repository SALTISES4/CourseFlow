import { logoutRequest } from '@cf/api/auth'
import { listMyNotificationsOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import strings from '@cf/utility/strings'
import { MenuItemType, SimpleMenu, StaticMenu } from '@cfComponents/menu/Menu'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import ReturnLinks from '@cfPages/Workspace/Workflow/WorkflowTabs/components/ReturnLinks'
import AccountCircle from '@mui/icons-material/AccountCircle'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AppBar from '@mui/material/AppBar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import * as SC from './styles'

/** First page only; large enough for the dropdown preview without loading the full inbox. */
const TOPBAR_NOTIFICATION_PREVIEW_PAGE_SIZE = 40

const TopBar = () => {
  const navigate = useNavigate()
  const { dispatch } = useDialog()

  const handleLogout = useCallback(() => {
    logoutRequest().then(() => {
      window.location.pathname = '/'
    })
  }, [])

  /*******************************************************
   * MENUS
   *******************************************************/
  const AddMenu = ({ show }: { show: boolean }) => {
    if (!show) {
      return
    }

    const header: MenuItemType = {
      iconButton: {
        icon: <AddCircleIcon />,
        'aria-label': 'add menu',
        'aria-controls': 'add-menu',
        'aria-haspopup': 'true',
        color: 'primary',
        size: 'large'
      },
      show: true
    }

    const menuItems: MenuItemType[] = [
      {
        content: strings.project,
        action: () => dispatch(DialogMode.PROJECT_CREATE),
        show: true
      },
      {
        content: strings.program,
        action: () =>
          dispatch(DialogMode.WORKFLOW_CREATE, {
            workflowType: WorkflowType.PROGRAM
          }),
        show: true
      },
      {
        content: strings.course,
        action: () =>
          dispatch(DialogMode.WORKFLOW_CREATE, {
            workflowType: WorkflowType.COURSE
          }),
        show: true
      },
      {
        content: strings.activity,
        action: () =>
          dispatch(DialogMode.WORKFLOW_CREATE, {
            workflowType: WorkflowType.ACTIVITY
          }),
        show: true
      }
    ]

    return <SimpleMenu id={'add-menu'} header={header} menuItems={menuItems} />
  }

  const AccountMenu = () => {
    const header: MenuItemType = {
      iconButton: {
        icon: <AccountCircle />,
        'aria-label': 'account of current user',
        'aria-controls': 'account-menu',
        'aria-haspopup': 'true',
        size: 'large'
      },
      show: true
    }

    const menuItems: MenuItemType[] = [
      {
        content: strings.profile,
        action: () => navigate(CFRoutes.PROFILE_SETTINGS),
        show: true
      },
      {
        content: strings.passwordReset,
        action: () => dispatch(DialogMode.PASSWORD_RESET),
        show: true
      },
      {
        content: strings.notificationSettings,
        action: () => navigate(CFRoutes.NOTIFICATIONS_SETTINGS),
        show: true,
        separator: true
      },
      {
        content: strings.signOut,
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
    const { data, isLoading } = useQuery({
      ...listMyNotificationsOptions({
        query: { page: 1, page_size: TOPBAR_NOTIFICATION_PREVIEW_PAGE_SIZE }
      })
    })

    if (isLoading) {
      return <></>
    }

    const items = data?.items ?? []
    const unreadCount = data?.meta.unread_count ?? 0

    const content = (
      <>
        <SC.NotificationsHeader>
          <Typography variant="h5">{strings.notifications}</Typography>
          <Link
            component={RouterLink}
            to={CFRoutes.NOTIFICATIONS}
            underline="always"
          >
            {strings.seeAll}
          </Link>
        </SC.NotificationsHeader>

        <SC.NotificationsList>
          {items.map((item) => (
            <ListItem
              key={String(item.uuid)}
              alignItems="flex-start"
              sx={{
                backgroundColor: !item.is_read ? 'courseflow.lightest' : null
              }}
            >
              <ListItemButton
                component={RouterLink}
                to={CFRoutes.NOTIFICATIONS}
              >
                {!item.is_read && <Badge color="primary" variant="dot" />}
                <ListItemText
                  primary={item.date_created}
                  secondary={
                    <Typography
                      sx={{ display: 'inline' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {item.message}
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
      iconButton: {
        icon: (
          <Badge badgeContent={unreadCount} color="primary">
            <NotificationsIcon />
          </Badge>
        ),
        'aria-label':
          unreadCount >= 1
            ? `show ${unreadCount} new notifications`
            : 'no new notifications',
        'aria-controls': 'notifications-menu',
        'aria-haspopup': 'true',
        size: 'large'
      },
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
   * RENDER
   *******************************************************/
  return (
    <SC.TopBarWrap>
      <AppBar position="static">
        <Toolbar variant="dense">
          <ReturnLinks />
          <Box sx={{ flexGrow: 1 }} className="title" />
          <Stack direction="row" spacing={1}>
            <AddMenu show />
            <NotificationsMenu />
            <AccountMenu />
          </Stack>
        </Toolbar>
      </AppBar>
    </SC.TopBarWrap>
  )
}

export default TopBar
