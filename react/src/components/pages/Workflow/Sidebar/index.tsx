import {
  type PermissionContextOut,
  WorkflowPermission
} from '@cf/api/gen/types.gen'
import {
  hasPermission,
  useWorkspacePermissions
} from '@cf/context/workspacePermissionsContext'
import { SidebarState } from '@cf/features/sidebar/state/sidebar.slice'
import {
  sidebarChangeTab,
  sidebarCollapse
} from '@cf/features/sidebar/state/sidebar.slice'
import { RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import useWorkflowSidebar from '@cfSidebar/hooks/useSidebar'
import { isTabVisible } from '@cfSidebar/hooks/useSidebar/permissions'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ChatIcon from '@mui/icons-material/Chat'
import EditIcon from '@mui/icons-material/Edit'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import LinkIcon from '@mui/icons-material/Link'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import { ReactNode, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import AddTab from './components/AddTab'
import CommentsTab from './components/CommentsTab'
import EditTab from './components/EditTab'
import { EditableType } from './components/EditTab/types'
import OutcomesTab from './components/OutcomesTab'
import RelatedTab from './components/RelatedTab'
import { SidebarTabsWrap, SidebarToggle, SidebarWrap } from './styles'

function getTabContent(
  tab: SidebarState['tab'],
  edit: SidebarState['edit']
): ReactNode {
  if (!tab) {
    return
  }

  switch (tab) {
    case 'edit': {
      const { uuid, objectType } = edit
      if (!uuid || !objectType) {
        return null
      }
      return (
        <EditTab uuid={uuid} type={objectType as unknown as EditableType} />
      )
    }
    case 'add':
      return <AddTab />
    case 'comments':
      return <CommentsTab />
    case 'outcomes':
      return <OutcomesTab />
    case 'related':
      return <RelatedTab />
    default:
      return <>{tab} tab not implemented yet</>
  }
}

function canUseTab(
  tab: SidebarState['tab'],
  editType: SidebarState['edit']['objectType'],
  permissions: PermissionContextOut
): boolean {
  switch (tab) {
    case 'add':
      return hasPermission(permissions, WorkflowPermission.NODE_MANAGEMENT)
    case 'comments':
      return hasPermission(permissions, WorkflowPermission.COMMENT)
    case 'outcomes':
      return hasPermission(permissions, WorkflowPermission.ASSIGN_OUTCOMES)
    case 'related':
      return hasPermission(permissions, WorkflowPermission.VIEW)
    case 'edit':
      if (editType === CfObjectType.OUTCOME) {
        return hasPermission(permissions, WorkflowPermission.OUTCOME_MANAGEMENT)
      }
      if (editType === CfObjectType.COLUMN) {
        return hasPermission(
          permissions,
          WorkflowPermission.NODE_CATEGORY_MANAGEMENT
        )
      }
      if (editType === CfObjectType.SECTION) {
        return hasPermission(permissions, WorkflowPermission.VIEW)
      }
      return hasPermission(permissions, WorkflowPermission.NODE_MANAGEMENT)
    default:
      return false
  }
}

// Object types that have Comments tab shown once clicked on/edited
const objectTypesWithComments: CfObjectType[] = [
  CfObjectType.NODE,
  CfObjectType.COLUMN,
  CfObjectType.SECTION,
  CfObjectType.OUTCOME
]

const WorkspaceSidebar = () => {
  const [sidebarConfig] = useWorkflowSidebar()
  const location = useLocation()
  const dispatch = useDispatch()
  const { resource: permissions } = useWorkspacePermissions()

  const sidebar = useSelector((state: RootState) => state.sidebar)

  const onToggleClick = useCallback(() => {
    dispatch(sidebarCollapse())
  }, [dispatch])

  const onTabClick = useCallback(
    (tab: SidebarState['tab']) => {
      if (!tab) {
        dispatch(sidebarCollapse())
      }

      if (tab) {
        dispatch(sidebarChangeTab({ tab, collapsed: false }))
      }
    },
    [dispatch]
  )

  // when pathname changes, dismiss sidebar
  // (internally also resets sidebar's 'edit' state)
  useEffect(() => {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
  }, [dispatch, location.pathname])

  const tabContent = canUseTab(
    sidebar.tab,
    sidebar.edit.objectType,
    permissions
  )
    ? getTabContent(sidebar.tab, sidebar.edit)
    : null

  const tabs: {
    disabled?: boolean
    value: Exclude<SidebarState['tab'], null>
    icon: ReactNode
  }[] = [
    {
      disabled: !sidebar.edit.objectType,
      value: 'edit',
      icon: <EditIcon />
    },
    {
      value: 'add',
      icon: <AddCircleIcon />
    },
    ...(sidebar.edit.objectType &&
    objectTypesWithComments.includes(sidebar.edit.objectType)
      ? [
          {
            value: 'comments' as const,
            icon: <ChatIcon />
          }
        ]
      : []),
    {
      value: 'outcomes',
      icon: <EmojiEventsOutlinedIcon />
    },
    {
      value: 'related',
      icon: <LinkIcon />
    }
  ]

  const visibleTabs: ReactNode[] = []

  // need both workflow type and view type in order to determine whether tabs show
  if (sidebarConfig.workflowType && sidebarConfig.viewType) {
    tabs.map((tab) => {
      if (
        tab &&
        isTabVisible(tab.value, sidebarConfig) &&
        canUseTab(tab.value, sidebar.edit.objectType, permissions)
      ) {
        visibleTabs.push(
          <ToggleButton
            key={tab.value}
            disabled={tab.disabled}
            size="small"
            color="primary"
            value={tab.value}
            aria-label={`${tab.value} tab`}
          >
            {tab.icon}
          </ToggleButton>
        )
      }
    })
  }

  if (!visibleTabs.length) {
    return null
  }

  return (
    <SidebarWrap
      collapsed={sidebar.collapsed}
      data-test-id="workflow-right-sidebar"
    >
      <SidebarTabsWrap
        exclusive
        orientation="vertical"
        value={sidebar.tab ?? false}
        onChange={(_, tab) => onTabClick(tab)}
      >
        {visibleTabs}
      </SidebarTabsWrap>

      <Paper>
        <SidebarToggle color="primary" onClick={onToggleClick}>
          <ArrowForwardIcon />
        </SidebarToggle>
        {tabContent}
      </Paper>
    </SidebarWrap>
  )
}

export default WorkspaceSidebar
