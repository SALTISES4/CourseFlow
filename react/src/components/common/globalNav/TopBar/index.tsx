import { logoutRequest } from '@cf/api/auth'
import { clearAccessToken } from '@cf/api/authToken'
import { WorkflowTypeIn } from '@cf/api/gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { MenuItemType, SimpleMenu } from '@cfComponents/menu/Menu'
import ReturnLinks from '@cfPages/Workflow/WorkflowTabs/components/ReturnLinks'
import AccountCircle from '@mui/icons-material/AccountCircle'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import * as SC from './styles'

const TopBar = () => {
  const { t } = useTranslation(['common', 'project', 'workflow'])
  const navigate = useNavigate()
  const { dispatch } = useDialog()

  const handleLogout = useCallback(() => {
    logoutRequest().then(() => {
      clearAccessToken()
      window.location.pathname = '/login'
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
        'aria-label': t('common:navigation.addMenu'),
        'aria-controls': 'add-menu',
        'aria-haspopup': 'true',
        color: 'primary',
        size: 'large'
      },
      show: true
    }

    const menuItems: MenuItemType[] = [
      {
        content: t('project:exportDialog.objectType.project'),
        action: () => dispatch(DialogMode.PROJECT_CREATE),
        show: true
      },
      {
        content: t('workflow:type.program'),
        action: () =>
          dispatch(DialogMode.WORKFLOW_CREATE, {
            workflowType: WorkflowTypeIn.PROGRAM
          }),
        show: true
      },
      {
        content: t('workflow:type.course'),
        action: () =>
          dispatch(DialogMode.WORKFLOW_CREATE, {
            workflowType: WorkflowTypeIn.COURSE
          }),
        show: true
      },
      {
        content: t('workflow:type.activity'),
        action: () =>
          dispatch(DialogMode.WORKFLOW_CREATE, {
            workflowType: WorkflowTypeIn.ACTIVITY
          }),
        show: true
      }
    ]

    return <SimpleMenu id="add-menu" header={header} menuItems={menuItems} />
  }

  const AccountMenu = () => {
    const header: MenuItemType = {
      iconButton: {
        icon: <AccountCircle />,
        'aria-label': t('common:navigation.accountMenu'),
        'aria-controls': 'account-menu',
        'aria-haspopup': 'true',
        size: 'large'
      },
      show: true
    }

    const menuItems: MenuItemType[] = [
      {
        content: t('common:navigation.profile'),
        action: () => navigate(CFRoutes.PROFILE_SETTINGS),
        show: true
      },
      {
        content: t('common:navigation.passwordReset'),
        action: () => navigate(CFRoutes.PASSWORD_RESET),
        show: true
      },
      {
        content: t('common:navigation.notificationSettings'),
        action: () => navigate(CFRoutes.NOTIFICATIONS_SETTINGS),
        show: true,
        separator: true
      },
      {
        content: t('common:navigation.signOut'),
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

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <SC.TopBarWrap data-test-id="top-bar">
      <AppBar position="static">
        <Toolbar variant="dense">
          <ReturnLinks />
          <Box style={{ flexGrow: 1 }} className="title" />
          <Stack direction="row" spacing={1}>
            <AddMenu show />
            {/* <NotificationsMenu /> */}
            <AccountMenu />
          </Stack>
        </Toolbar>
      </AppBar>
    </SC.TopBarWrap>
  )
}

export default TopBar
