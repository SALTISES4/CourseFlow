import useWorkflowSidebar from '@cf/components/pages/Workspace/Workflow/Sidebar/hooks/useSidebar'
import { isTabVisibile } from '@cf/components/pages/Workspace/Workflow/Sidebar/hooks/useSidebar/permissions'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EditIcon from '@mui/icons-material/Edit'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import LinkIcon from '@mui/icons-material/Link'
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import { produce } from 'immer'
import { ReactNode, useCallback, useEffect, useState } from 'react'

import AddTab from './components/AddTab'
import EditTab from './components/EditTab'
import OutcomesTab from './components/OutcomesTab'
import RelatedTab from './components/RelatedTab'
import RestoreTab from './components/RestoreTab'
import useEditable from './hooks/useEditable'
import { EditablePropsType } from './hooks/useEditable/types'
import { SidebarTabsWrap, SidebarToggle, SidebarWrap } from './styles'
import { SidebarDataType } from './types'

type StateType = {
  tab: keyof SidebarDataType | null
  collapsed: boolean
}

const initialState: StateType = {
  tab: null,
  collapsed: true
}

function getCurrentTab(
  tab: keyof SidebarDataType | null,
  props: SidebarDataType,
  editable: EditablePropsType
): ReactNode {
  if (!tab) {
    return
  }

  switch (tab) {
    case 'edit':
      return <EditTab {...editable} />
    case 'add':
      return <AddTab {...(props[tab] as SidebarDataType['add'])} />
    case 'restore':
      return <RestoreTab {...(props[tab] as SidebarDataType['restore'])} />
    case 'outcomes':
      return <OutcomesTab {...(props[tab] as SidebarDataType['outcomes'])} />
    case 'related':
      return <RelatedTab {...(props[tab] as SidebarDataType['related'])} />
    default:
      return <>{tab} tab not implemented yet</>
  }
}

const WorkspaceSidebar = (props: SidebarDataType) => {
  const [state, setState] = useState<StateType>(initialState)
  const editable = useEditable()
  const [sidebarConfig] = useWorkflowSidebar()

  useEffect(() => {
    if (editable.type) {
      onTabClick('edit')
    } else {
      setState({
        tab: null,
        collapsed: true
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable.type])

  const onToggleClick = useCallback(() => {
    setState({
      tab: null,
      collapsed: !state.collapsed
    })
  }, [state.collapsed])

  const onTabClick = (tab: keyof SidebarDataType | null) => {
    if (!tab) {
      return setState(
        produce((draft) => {
          draft.tab = null
          draft.collapsed = true
        })
      )
    }

    if (tab) {
      return setState(
        produce((draft) => {
          draft.tab = tab
          draft.collapsed = false
        })
      )
    }

    if (state.collapsed) {
      setState(
        produce((draft) => {
          draft.collapsed = false
        })
      )
    }
  }

  const { add, edit, outcomes, restore } = props
  const tabContent = getCurrentTab(state.tab, props, {
    type: editable.type,
    data: editable.data
  })

  const tabs: {
    disabled?: boolean
    value: keyof SidebarDataType
    icon: ReactNode
  }[] = [
    {
      disabled: edit.readonly && !editable.type,
      value: 'edit',
      icon: <EditIcon />
    },
    {
      disabled: add.readonly,
      value: 'add',
      icon: <AddCircleIcon />
    },
    {
      disabled: outcomes.readonly,
      value: 'outcomes',
      icon: <EmojiEventsOutlinedIcon />
    },
    {
      disabled: restore.readonly,
      value: 'restore',
      icon: <RestoreFromTrashIcon />
    },
    {
      value: 'related',
      icon: <LinkIcon />
    }
  ]

  return (
    <SidebarWrap collapsed={state.collapsed}>
      <SidebarTabsWrap
        exclusive
        orientation="vertical"
        value={state.tab}
        onChange={(_, tab) => onTabClick(tab)}
      >
        {tabs.map((tab) => {
          return isTabVisibile(tab.value, sidebarConfig) ? (
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
          ) : null
        })}
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
