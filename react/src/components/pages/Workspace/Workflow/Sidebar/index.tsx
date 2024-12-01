import useWorkflowSidebar from '@cf/components/pages/Workspace/Workflow/Sidebar/hooks/useSidebar'
import { isTabVisible } from '@cf/components/pages/Workspace/Workflow/Sidebar/hooks/useSidebar/permissions'
import { SidebarState } from '@cfRedux/slices/sidebar.slice'
import {
  sidebarChangeTab,
  sidebarCollapse
} from '@cfRedux/slices/sidebar.slice'
import { AppState } from '@cfRedux/types/type'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EditIcon from '@mui/icons-material/Edit'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import LinkIcon from '@mui/icons-material/Link'
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import { ReactNode, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import AddTab from './components/AddTab'
import EditTab from './components/EditTab'
import { EditableType } from './components/EditTab/types'
import OutcomesTab from './components/OutcomesTab'
import RelatedTab from './components/RelatedTab'
import RestoreTab from './components/RestoreTab'
import { SidebarTabsWrap, SidebarToggle, SidebarWrap } from './styles'
import {RootState} from "@cfRedux/store";

function getTabContent(
  tab: SidebarState['tab'],
  edit: SidebarState['edit']
): ReactNode {
  if (!tab) {
    return
  }

  switch (tab) {
    case 'edit':
      return <EditTab type={edit.objectType as unknown as EditableType} />
    case 'add':
      return <AddTab />
    case 'restore':
      return <RestoreTab />
    case 'outcomes':
      return <OutcomesTab />
    case 'related':
      return <RelatedTab />
    default:
      return <>{tab} tab not implemented yet</>
  }
}

const WorkspaceSidebar = () => {
  const [sidebarConfig] = useWorkflowSidebar()
  const location = useLocation()
  const dispatch = useDispatch()

  const sidebar = useSelector((state: RootState) => state.sidebar)

  useEffect(() => {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
  }, [dispatch, location.pathname])

  useEffect(() => {
    if (sidebar.edit.objectType) {
      onTabClick('edit')
    } else {
      dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebar.edit.objectType])

  const onToggleClick = useCallback(() => {
    dispatch(sidebarCollapse())
  }, [dispatch])

  const onTabClick = (tab: SidebarState['tab']) => {
    if (!tab) {
      dispatch(sidebarCollapse())
    }

    if (tab) {
      dispatch(sidebarChangeTab({ tab, collapsed: false }))
    }
  }

  const tabContent = getTabContent(sidebar.tab, sidebar.edit)

  const tabs: {
    disabled?: boolean
    value: SidebarState['tab']
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
    {
      value: 'outcomes',
      icon: <EmojiEventsOutlinedIcon />
    },
    {
      value: 'restore',
      icon: <RestoreFromTrashIcon />
    },
    {
      value: 'related',
      icon: <LinkIcon />
    }
  ]

  const visibleTabs: ReactNode[] = []
  tabs.map((tab) => {
    if (isTabVisible(tab.value, sidebarConfig)) {
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

  if (!visibleTabs.length) {
    return null
  }

  return (
    <SidebarWrap collapsed={sidebar.collapsed}>
      <SidebarTabsWrap
        exclusive
        orientation="vertical"
        value={sidebar.tab}
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
