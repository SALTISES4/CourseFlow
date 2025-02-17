import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { CellDataType, DraggableType } from '@cfViews/WorkflowView/componentViews/WorkflowEditViewV2/types'
import { SxProps } from '@mui/material'
import Typography from '@mui/material/Typography'
import { ElementType, ReactNode, useEffect, useRef } from 'react'

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

const DraggableBlock = ({
  sx,
  type,
  typeColor,
  highlight,
  component,
  label,
  toggle,
  dashed
}: PropsType) => {
  const dragRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = dragRef.current

    // dummy "dynamic" data
    // TODO: properly type this out
    let data = {}

    if (type === DraggableType.REUSABLE || type === DraggableType.STRATEGIES) {
      data = {
        id: 3,
        rows: [] // board rows
      }
    }

    if (type === DraggableType.COLUMN) {
      data = {}
    }

    if (type === DraggableType.CELL) {
      data = {
        coords: {
          week: -1,
          x: 0,
          y: -1
        }
      }
    }

    return draggable({
      element: el,
      getInitialData: () => ({
        type,
        ...data
      })
    })
  }, [type])

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
      {toggle}
    </Styled.DraggableWrap>
  )
}

export default DraggableBlock
