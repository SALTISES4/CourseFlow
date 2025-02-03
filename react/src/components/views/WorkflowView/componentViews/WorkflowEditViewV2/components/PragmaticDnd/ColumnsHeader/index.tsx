import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import Column from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/column/Column'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import { produce } from 'immer'
import { useEffect, useRef, useState } from 'react'

import * as Styled from '../../../styles'

type PropsType = {
  columns: number[]
  parentId: number
  onReorder: (oldIndex: number, newIndex: number) => void
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
  const ref = useRef(null)
  const [state, setState] = useState({
    draggedOver: false
  })

  useEffect(() => {
    const el = ref.current

    return dropTargetForElements({
      element: el,
      onDragEnter: ({ source }) => {
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
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({
    dragging: false
  })

  useEffect(() => {
    const el = ref.current

    return draggable({
      element: el,
      getInitialData: () => ({ index, columnId }),
      onDragStart: () =>
        setState(
          produce((draft) => {
            draft.dragging = !draft.dragging
          })
        ),
      onDrop: () =>
        setState(
          produce((draft) => {
            draft.dragging = false
          })
        )
    })
  }, [index, columnId])

  return (
    <div ref={ref} style={{ opacity: state.dragging ? 0.2 : 1 }}>
      <DragHandleIcon />
      <Column objectId={columnId} parentId={parentId} />
    </div>
  )
}

export default ColumnsHeader
