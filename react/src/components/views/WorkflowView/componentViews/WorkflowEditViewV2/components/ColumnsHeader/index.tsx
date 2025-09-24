import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { CfObjectType } from '@cf/types/enum'
import { RootState } from '@cfRedux/store'
import { produce } from 'immer'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import * as Styled from '../../styles'
import { ColumnReorderCallbackFn, DraggableType } from '../../types'
import ColumnInner from '../ColumnInner'

type PropsType = {
  columns: number[]
  parentId: number
  onReorder: ColumnReorderCallbackFn
}

const ColumnsHeader = ({ columns, parentId, onReorder }: PropsType) => {
  return (
    <div data-test-id="columns-block">
      <Styled.CellRow>
        {columns.map((columnId, index) => (
          <ColumnCell
            key={`column-header-${columnId}`}
            index={index}
            columnId={columnId}
            parentId={parentId}
            onReorder={onReorder}
          />
        ))}
      </Styled.CellRow>
    </div>
  )
}

type CellProps = {
  index: number
  columnId: number
  parentId: number
  onReorder: PropsType['onReorder']
}

const ColumnCell = ({ index, columnId, parentId, onReorder }: CellProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({
    draggedOver: false
  })

  useEffect(() => {
    const el = ref.current

    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => {
        // early exit for unsupported draggables
        if (source.data.type !== DraggableType.COLUMN) {
          return false
        }

        return true
      },
      onDragEnter: ({ source }) => {
        // early exit if no position change
        if (source.data.index === index) {
          return
        }

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
      onDrop: ({ source }) => {
        if (source.data.index !== index) {
          onReorder(source.data.index as number, index)
        }
        setState(
          produce((draft) => {
            draft.draggedOver = false
          })
        )
      }
    })
  }, [index, onReorder])

  return (
    <Styled.Cell
      ref={ref}
      sx={{ backgroundColor: state.draggedOver && '#dbdbdb' }}
    >
      <ColumnCellInner index={index} columnId={columnId} parentId={parentId} />
    </Styled.Cell>
  )
}

const ColumnCellInner = ({
  index,
  columnId,
  parentId
}: Omit<CellProps, 'onReorder'>) => {
  const sidebarData = useSelector((state: RootState) => state.sidebar.edit)
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({
    dragging: false
  })

  const selected =
    sidebarData.objectType === CfObjectType.COLUMN &&
    sidebarData.id === columnId

  useEffect(() => {
    const el = ref.current

    return draggable({
      element: el,
      getInitialData: () => ({ index, columnId, type: DraggableType.COLUMN }),
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
  }, [index, columnId])

  return (
    <Styled.CellInner ref={ref} selected={selected} dragging={state.dragging}>
      <ColumnInner objectId={columnId} parentId={parentId} />
    </Styled.CellInner>
  )
}

export default ColumnsHeader
