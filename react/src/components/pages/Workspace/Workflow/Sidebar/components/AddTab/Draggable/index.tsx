import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { svglinkAllowDND } from '@cf/redux/slices/svglink.slice'
import { DraggableType } from '@cfViews/WorkflowView/WorkflowEditView/types'
import { SxProps } from '@mui/material'
import Typography from '@mui/material/Typography'
import { ElementType, ReactNode, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'

import * as Styled from './styles'

type PropsType = {
  id: number | string
  type: DraggableType
  label: string
  typeColor?: string
  sx?: SxProps
  component?: ElementType
  highlight?: boolean
  dashed?: boolean
  toggle?: ReactNode
}

const DraggableItem = ({
  sx,
  id,
  type,
  typeColor,
  highlight,
  component,
  label,
  dashed
}: PropsType) => {
  const dispatch = useDispatch()
  const dragRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = dragRef.current
    return draggable({
      element: el,
      getInitialData: () => ({
        id,
        type
      }),
      onDragStart: () => dispatch(svglinkAllowDND(true)),
      onDrop: () => dispatch(svglinkAllowDND(false))
    })
  }, [id, type, dispatch])

  return (
    <Styled.DraggableWrap
      ref={dragRef}
      typeColor={typeColor}
      component={component}
      highlight={highlight}
      dashed={dashed}
      sx={sx}
    >
      <Styled.DraggableDragWrap>
        <Styled.DraggableDragHandle />
        <Typography variant="body2">{label}</Typography>
      </Styled.DraggableDragWrap>
    </Styled.DraggableWrap>
  )
}

export default DraggableItem
