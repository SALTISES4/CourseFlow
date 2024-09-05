import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import EditIcon from '@mui/icons-material/Edit'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import { produce } from 'immer'
import { ReactNode, useState } from 'react'

import AddTab from './components/AddTab'
import OutcomesTab from './components/OutcomesTab'
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
  props: SidebarDataType
): ReactNode {
  if (!tab) {
    return
  }

  switch (tab) {
    case 'add':
      return <AddTab {...(props[tab] as SidebarDataType['add'])} />
    case 'outcomes':
      return <OutcomesTab {...(props[tab] as SidebarDataType['outcomes'])} />
    default:
      return <>{tab} tab not implemented yet</>
  }
}

const WorkspaceSidebar = (props: SidebarDataType) => {
  const [state, setState] = useState<StateType>(initialState)

  const onToggleClick = () => {
    setState({
      tab: null,
      collapsed: !state.collapsed
    })
  }

  const onTabClick = (tab: keyof SidebarDataType) => {
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
  const tabContent = getCurrentTab(state.tab, props)

  return (
    <SidebarWrap collapsed={state.collapsed}>
      <SidebarTabsWrap
        exclusive
        orientation="vertical"
        value={state.tab}
        onChange={(_, tab) => onTabClick(tab)}
      >
        <ToggleButton
          disabled={edit.readonly}
          size="small"
          color="primary"
          value="edit"
          aria-label="Edit tab"
        >
          <EditIcon />
        </ToggleButton>
        <ToggleButton
          disabled={add.readonly}
          size="small"
          color="primary"
          value="add"
          aria-label="Add tab"
        >
          <AddCircleIcon />
        </ToggleButton>
        <ToggleButton
          disabled={outcomes.readonly}
          size="small"
          color="primary"
          value="outcomes"
          aria-label="Outcomes tab"
        >
          <EmojiEventsOutlinedIcon />
        </ToggleButton>
        <ToggleButton
          disabled={restore.readonly}
          size="small"
          color="primary"
          value="restore"
          aria-label="Restore tab"
        >
          <FlagOutlinedIcon />
        </ToggleButton>
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
