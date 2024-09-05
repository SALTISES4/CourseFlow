import Typography from '@mui/material/Typography'

import { GroupWrap } from '../../styles'
import { SidebarDataType } from '../../types'
import DraggableBlock from '../DraggableBlock'

const AddTab = ({ title, subtitle, groups }: SidebarDataType['add']) => (
  <>
    <Typography component="h3" variant="h6" sx={{ mb: 3, fontWeight: '600' }}>
      {title}
    </Typography>
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
  </>
)

export default AddTab
