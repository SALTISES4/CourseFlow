import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { ReactNode, useCallback, useState } from 'react'

import data from './data'
import { StyledOutcomes } from './styles'
import DraggableBlock from '../../Draggable'
import { DraggableBlockToggle } from '../../Draggable/styles'
import type { DraggableBlockType } from '../../Draggable/types'
import {
  GroupWrap,
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../styles'
import { OutcomeGroup } from '../../types'

const OutcomeTab = () => {
  const { title, subtitle, groups } = data

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        {title && (
          <SidebarTitle as="h3" variant="h6">
            {title}
          </SidebarTitle>
        )}
        {subtitle && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
        )}
        {groups?.map((group, idx) => (
          <GroupWrap key={idx}>
            <Typography component="h6" variant="body2">
              {group.title}
            </Typography>
            <OutcomeGroupWrap group={group} blocks={group.blocks} />
          </GroupWrap>
        ))}
      </SidebarContent>
      <SidebarActions>
        <Button variant="contained" color="secondary">
          Edit outcomes
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export const OutcomeGroupWrap = ({
  group,
  blocks
}: {
  group: OutcomeGroup
  blocks: OutcomeGroup['blocks']
}) => {
  if (!group) {
    return null
  }

  const items = blocks.map((block, index) => (
    <DraggableOutcomes key={index} group={group} block={block} />
  )) ?? <></>

  return <StyledOutcomes>{items as ReactNode}</StyledOutcomes>
}

const DraggableOutcomes = ({
  group,
  block
}: {
  group: OutcomeGroup
  block: DraggableBlockType
}) => {
  const [collapsed, setCollapsed] = useState(true)

  const onToggleClick = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed])

  return (
    <li key={block.id}>
      <DraggableBlock
        id={block.id}
        // TODO: properly type this thing when working on outcome tabs
        type={group.type as any}
        label={block.label}
        toggle={
          block.blocks ? (
            <DraggableBlockToggle onClick={onToggleClick}>
              {collapsed ? (
                <AddIcon fontSize="small" />
              ) : (
                <RemoveIcon fontSize="small" />
              )}
            </DraggableBlockToggle>
          ) : null
        }
      />
      {block.blocks && !collapsed && (
        <OutcomeGroupWrap
          group={{ type: group.type } as OutcomeGroup}
          blocks={block.blocks}
        />
      )}
    </li>
  )
}

export default OutcomeTab
