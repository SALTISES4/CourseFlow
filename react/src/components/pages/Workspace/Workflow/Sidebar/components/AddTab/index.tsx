import * as SC from '@cfSidebar/styles'
import Typography from '@mui/material/Typography'

import data from './data'
import DraggableBlock from '../../Draggable/Block'

const AddTab = () => {
  const { title, subtitle, groups } = data

  return (
    <SC.SidebarInnerWrap>
      <SC.SidebarContent>
        <SC.SidebarTitle as="h3" variant="h6">
          {title}
        </SC.SidebarTitle>
        {subtitle && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
        )}
        {groups?.map((group, idx) => (
          <SC.GroupWrap key={idx}>
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
          </SC.GroupWrap>
        ))}
      </SC.SidebarContent>
    </SC.SidebarInnerWrap>
  )
}

export default AddTab
