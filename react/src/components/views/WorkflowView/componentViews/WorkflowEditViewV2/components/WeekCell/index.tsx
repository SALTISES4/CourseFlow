import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import useHover from '@cf/hooks/useHover'
import { alpha } from '@mui/material'
import { produce } from 'immer'
import { useEffect, useRef, useState } from 'react'

import HoverMenu from './components/HoverMenu'
import * as StyledNode from './styles'
import { NodePropsType, PhantomPropsType, WeekCellNodeType } from './types'
import * as Styled from '../../styles'
import { CellDataType, DraggableType } from '../../types'
import { isGridCell } from '../../types'

type PropsType = PhantomPropsType | NodePropsType

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

        if (
          data.coords.x !== props.coords.x &&
          props.type === WeekCellNodeType.PHANTOM
        ) {
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

const WeekCellInner = (props: PropsType) => {
  const [ref, isHovered] = useHover()
  const [state, setState] = useState({
    dragging: false
  })

  const { coords, type, borderColor } = props

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
  }, [ref, coords])

  // TODO: add NodeLink / NodePorts for node link lines to work

  if (type === WeekCellNodeType.PHANTOM) {
    return <div style={{ backgroundColor: borderColor }} />
  } else {
    const { title, description, onClick } = props

    return (
      <Styled.CellInner ref={ref} dragging={state.dragging}>
        <HoverMenu show={isHovered} />
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
}

export default WeekCell
