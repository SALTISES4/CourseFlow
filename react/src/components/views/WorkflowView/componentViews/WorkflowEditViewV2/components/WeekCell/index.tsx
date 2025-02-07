import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { alpha } from '@mui/material'
import { produce } from 'immer'
import { MouseEvent, ReactNode, useEffect, useRef, useState } from 'react'

import * as StyledNode from './styles'
import * as Styled from '../../styles'
import { CellDataType, DraggableType } from '../../types'
import { isGridCell } from '../../types'

type PropsType = {
  coords: CellDataType['coords']
  type: 'phantom' | 'node'
  borderColor: string
  title?: string | ReactNode
  description?: string | ReactNode
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  onReorder?: (coords: CellDataType['coords'], newIndex: number) => void
}

const WeekCell = (props: PropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({
    draggedOver: false
  })

  useEffect(() => {
    const el = ref.current

    return dropTargetForElements({
      element: el,
      onDragEnter: () => {
        setState(
          produce((draft) => {
            draft.draggedOver = true
          })
        )
      },
      onDragLeave: () => {
        setState(
          produce((draft) => {
            draft.draggedOver = false
          })
        )
      },
      canDrop: ({ source }) => {
        const data = source.data

        if (!isGridCell(data)) {
          return
        }

        // early exit if different row - and to disable column swapping with the new row
        // if (data.coords.y !== props.coords.y) {
        //   return false
        // }

        return true
      },
      onDrop: ({ source }) => {
        const data = source.data

        if (!isGridCell(data)) {
          return
        }

        if (data.coords.x !== props.coords.x) {
          props.onReorder(data.coords, props.coords.x)
        }

        setState(
          produce((draft) => {
            draft.draggedOver = false
          })
        )
      }
    })
  }, [props])

  return (
    <Styled.Cell
      ref={ref}
      sx={{
        minHeight: '50px',
        backgroundColor: state.draggedOver && alpha(props.borderColor, 0.2)
      }}
    >
      <WeekCellInner {...props} />
    </Styled.Cell>
  )
}

const WeekCellInner = ({
  coords,
  type,
  borderColor,
  title,
  description,
  onClick
}: PropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({
    dragging: false
  })

  useEffect(() => {
    const el = ref.current

    if (!el) {
      return
    }

    return draggable({
      element: el,
      getInitialData: (): CellDataType => ({
        coords,
        type: DraggableType.CELL
      }),
      onDragStart: () => {
        setState(
          produce((draft) => {
            draft.dragging = !draft.dragging
          })
        )
      },
      onDrop: () => {
        setState(
          produce((draft) => {
            draft.dragging = false
          })
        )
      }
    })
  }, [coords])

  return type === 'phantom' ? (
    <div style={{ backgroundColor: borderColor }} />
  ) : (
    <Styled.CellInner ref={ref} dragging={state.dragging}>
      <StyledNode.Border sx={{ backgroundColor: borderColor }} />
      <StyledNode.Content onClick={onClick}>
        <StyledNode.Title variant="subtitle2">{title}</StyledNode.Title>
        {description && (
          <StyledNode.Subtitle variant="caption">
            {description}
          </StyledNode.Subtitle>
        )}
      </StyledNode.Content>
    </Styled.CellInner>
  )
}

export default WeekCell
