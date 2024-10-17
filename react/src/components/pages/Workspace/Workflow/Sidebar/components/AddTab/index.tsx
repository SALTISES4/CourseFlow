import Typography from '@mui/material/Typography'

import DraggableBlock from '../../Draggable/Block'
import {
  GroupWrap,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../styles'
import { SidebarDataType } from '../../types'

const AddTab = ({ title, subtitle, groups }: SidebarDataType['add']) => (
  <SidebarInnerWrap>
    <SidebarContent>
      <SidebarTitle as="h3" variant="h6">
        {title}
      </SidebarTitle>
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
          {group.blocks && (
            <ul>
              {group.blocks.map((block) => (
                <DraggableBlock
                  component="li"
                  key={block.id}
                  id={block.id}
                  group={group.type}
                  type={block.type}
                  label={block.label}
                />
              ))}
            </ul>
          )}
        </GroupWrap>
      ))}
    </SidebarContent>
  </SidebarInnerWrap>
)

export default AddTab
