import { useDraggable } from '@dnd-kit/core'
import Typography from '@mui/material/Typography'
import { ElementType } from 'react'

import { DragHandle, Wrap } from './styles'
import { DraggableType } from './types'

type PropsType = DraggableType & {
  component?: ElementType
  highlight?: boolean
}

const DraggableBlock = ({
  highlight,
  component,
  id,
  group,
  label,
  type
}: PropsType) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `${group}_${type}_${id}`,
    data: {
      id,
      type,
      group,
      label
    }
  })

  return (
    <Wrap
      ref={setNodeRef}
      component={component}
      highlight={highlight}
      group={group}
    >
      <DragHandle
        {...listeners}
        {...attributes}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
      <Typography variant="body2">{label}</Typography>
    </Wrap>
  )
}

export default DraggableBlock
