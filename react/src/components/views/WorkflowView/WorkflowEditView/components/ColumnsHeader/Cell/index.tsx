import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import useHover from '@cf/hooks/useHover'
import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { selectColumnById } from '@cf/redux/selectors/column.selector'
import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { RootState } from '@cfRedux/store'
import clsx from 'clsx'
import { produce } from 'immer'
import { MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import HoverMenu from './HoverMenu'
import * as Styled from './styles'
import * as StyledWorkflow from '../../../styles'
import { ColumnReorderCallbackFn, DraggableType } from '../../../types'

type CellProps = {
  index: number
  columnId: number
  parentId: number
  draggingOver?: boolean
  onReorder: ColumnReorderCallbackFn
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
    <StyledWorkflow.Cell ref={ref} data-column-id={columnId}>
      <ColumnCellInner
        index={index}
        columnId={columnId}
        parentId={parentId}
        draggingOver={state.draggedOver}
      />
    </StyledWorkflow.Cell>
  )
}

const ColumnCellInner = ({
  index,
  columnId,
  parentId,
  draggingOver
}: Omit<CellProps, 'onReorder'>) => {
  const [ref, isHovering] = useHover()
  const dispatch = useDispatch()
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  const column = useSelector((state: RootState) =>
    selectColumnById(state, columnId)
  )
  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.COLUMN &&
      state.sidebar.edit.id === columnId
  )
  const [state, setState] = useState({
    dragging: false
  })
  const objectType = CfObjectType.COLUMN

  const manager = useMemo(
    () => new BetterSelectionManager(dispatch),
    [dispatch]
  )

  const onClickHandler = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (column) {
      manager.updateSidebar(column.id, objectType, parentId)
    }
  }

  const columnColourHex = useMemo(() => {
    return ThemeHelper.getColumnColour({
      columnType: column.columnType,
      colour: column.colour
    })
  }, [column.colour, column.columnType])

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
  }, [index, columnId, ref])

  if (!column || !workflow) {
    return null
  }

  const title = column.title ?? column.columnTypeDisplay

  return (
    <Styled.ColumnWrap ref={ref} dragging={state.dragging}>
      <Styled.Background
        selected={selected}
        hovering={isHovering}
        draggingOver={draggingOver}
      />
      <HoverMenu nodeId={columnId} show={isHovering} />
      <Styled.Inner
        border={column.lock && `2px solid ${column.lock.userColour}`}
        className={clsx(
          column.lock && 'locked',
          column.lock && `locked-${column.lock.userId}`
        )}
        onClick={onClickHandler}
      >
        <Styled.Border color={columnColourHex} />
        <Styled.Title variant="body2">
          <span dangerouslySetInnerHTML={{ __html: title }}></span>
        </Styled.Title>
      </Styled.Inner>
    </Styled.ColumnWrap>
  )
}

export default ColumnCell
