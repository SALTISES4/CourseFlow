import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { svglinkAllowDND } from '@cf/features/graph/state/slices/svglink.slice'
import { DraggableType } from '@cfViews/WorkflowView/GraphView/types'
import { SxProps } from '@mui/material'
import Typography from '@mui/material/Typography'
import { ElementType, ReactNode, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'

import * as Styled from './styles'

type PropsType = {
  uuid: string | string
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
  uuid,
  type,
  typeColor,
  highlight,
  component,
  label,
  dashed
}: PropsType) => {
  const dispatch = useDispatch()
  const dragRef = useRef<HTMLDivElement>(null)
  const testId =
    type === DraggableType.SIDEBAR_NODE
      ? 'workflow-add-tab-node-category-item'
      : type === DraggableType.SIDEBAR_NODE_CUSTOM
        ? 'workflow-add-tab-custom-node-category-item'
        : 'workflow-add-tab-draggable-item'

  useEffect(() => {
    const el = dragRef.current
    if (!el) {
      return
    }

    return draggable({
      element: el,
      getInitialData: () => ({
        uuid,
        type
      }),
      onDragStart: () => dispatch(svglinkAllowDND(true)),
      onDrop: () => dispatch(svglinkAllowDND(false))
    })
  }, [uuid, type, dispatch])

  return (
    <Styled.DraggableWrap
      ref={dragRef}
      typeColor={typeColor}
      component={component}
      highlight={highlight}
      dashed={dashed}
      sx={sx}
      data-test-id={testId}
      data-draggable-uuid={uuid}
    >
      <Styled.DraggableDragWrap>
        <Styled.DraggableDragHandle />
        <Typography variant="body2">{label}</Typography>
      </Styled.DraggableDragWrap>
    </Styled.DraggableWrap>
  )
}

export default DraggableItem
