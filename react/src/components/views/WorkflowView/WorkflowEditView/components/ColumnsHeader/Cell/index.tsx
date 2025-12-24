import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box'
import useHover from '@cf/hooks/useHover'
import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { selectColumnById } from '@cf/redux/selectors/column.selector'
import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { RootState } from '@cfRedux/store'
import clsx from 'clsx'
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
  onReorder: ColumnReorderCallbackFn
}

const ColumnCell = ({ index, columnId, parentId, onReorder }: CellProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const [closestEdge, setClosestEdge] = useState<Edge>(null)

  useEffect(() => {
    const el = ref.current

    return dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          {},
          {
            input,
            element,
            allowedEdges: ['left', 'right']
          }
        )
      },
      onDragLeave: () => setClosestEdge(null),
      onDrag: ({ self, source }) => {
        if (source.data.index !== index) {
          setClosestEdge(extractClosestEdge(self.data))
        }
      },
      canDrop: ({ source }) => source.data.type === DraggableType.COLUMN,
      onDrop: ({ source }) => {
        const fromIndex = source.data.index as number
        let toIndex = index

        if (fromIndex < toIndex && closestEdge === 'left') {
          toIndex -= 1
        }

        if (fromIndex > toIndex && closestEdge === 'right') {
          toIndex += 1
        }

        if (fromIndex !== toIndex) {
          onReorder(fromIndex, toIndex)
        }
        setClosestEdge(null)
      }
    })
  }, [index, closestEdge, onReorder])

  return (
    <StyledWorkflow.Cell ref={ref} data-column-id={columnId}>
      <ColumnCellInner index={index} columnId={columnId} parentId={parentId} />
      {closestEdge && (
        <DropIndicator edge={closestEdge} type="no-terminal" gap="24px" />
      )}
    </StyledWorkflow.Cell>
  )
}

const ColumnCellInner = ({
  index,
  columnId,
  parentId
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
  const [dragging, setDragging] = useState(false)

  const manager = useMemo(
    () => new BetterSelectionManager(dispatch),
    [dispatch]
  )

  const onClickHandler = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (column) {
      manager.updateSidebar(column.id, CfObjectType.COLUMN, parentId)
    }
  }

  const columnColourHex = ThemeHelper.getColumnColour({
    columnType: column.columnType,
    colour: column.colour
  })

  useEffect(() => {
    const el = ref.current

    return draggable({
      element: el,
      getInitialData: () => ({ index, columnId, type: DraggableType.COLUMN }),
      onDragStart: () => setDragging(!dragging),
      onDrop: () => setDragging(false)
    })
  }, [columnId, dragging, index, ref])

  if (!column || !workflow) {
    return null
  }

  const title = column.title?.length ? column.title : column.columnTypeDisplay

  return (
    <Styled.ColumnWrap ref={ref} dragging={dragging}>
      <Styled.Background selected={selected} hovering={isHovering} />
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
