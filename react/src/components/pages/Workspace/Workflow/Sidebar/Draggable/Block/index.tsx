import { useDraggable } from '@dnd-kit/core'
import { SxProps } from '@mui/material'
import Typography from '@mui/material/Typography'
import { ElementType, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { DragHandle, DragWrap, Wrap } from './styles'
import { DraggableType } from './types'

type PropsType = DraggableType & {
  sx?: SxProps
  component?: ElementType
  highlight?: boolean
  toggle?: ReactNode
}

const DraggableBlock = ({
  sx,
  highlight,
  component,
  id,
  group,
  label,
  type,
  toggle
}: PropsType) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: uuidv4(),
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
      sx={sx}
    >
      <DragWrap>
        <DragHandle {...listeners} {...attributes} />
        <Typography variant="body2">{label}</Typography>
      </DragWrap>
      {toggle}
    </Wrap>
  )
}

export default DraggableBlock
