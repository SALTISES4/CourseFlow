import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { produce } from 'immer'
import {
  Fragment,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as StyledWeek from './styles'
import * as Styled from '../../styles'
import { DroppableType, isGridCell, isGridRow } from '../../types'
import {
  BoardWeekRowType,
  CellReorderCallbackFn,
  RowReorderCallbackFn
} from '../../types'
import WeekCell from '../WeekCell'

type WeekPropsType = {
  index: number
  weekId: number
  weekRows: BoardWeekRowType[]
  parentId: number
  columnIds: number[]
  columnColors: string[]
  onReorder: CellReorderCallbackFn
  onRowReorder: RowReorderCallbackFn
}

const Week = (props: WeekPropsType) => {
  const dispatch = useDispatch()
  const [expanded, setExpanded] = useState(true)
  const workflow = useSelector((state: AppState) => state.workflow)
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, props.weekId)
  )
  const manager = useRef(new BetterSelectionManager(dispatch))

  const onWeekWrapperClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      manager.current.updateSidebar(
        props.weekId,
        CfObjectType.WEEK,
        props.parentId
      )
    },
    [props.parentId, props.weekId]
  )

  const onNodeClick = useCallback(
    (e: MouseEvent<HTMLDivElement>, nodeId: number) => {
      e.stopPropagation()
      manager.current.updateSidebar(nodeId, CfObjectType.NODE, props.parentId)
    },
    [props.parentId]
  )

  const onCollapseIconClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      setExpanded(!expanded)
    },
    [expanded]
  )

  const weekGrid = props.weekRows.map((row, rowIndex) => (
    <WeekRow
      key={`week_${props.weekId}_${rowIndex}`}
      row={row}
      rowIndex={rowIndex}
      rowCount={props.weekRows.length}
      weekId={props.weekId}
      parentId={props.parentId}
      columnColors={props.columnColors}
      onReorder={props.onReorder}
      onRowReorder={props.onRowReorder}
      onNodeClick={onNodeClick}
    />
  ))

  const defaultText = !workflow.isStrategy
    ? `${weekData.week.weekTypeDisplay} ${weekData.week.order + 1}`
    : undefined

  return (
    <StyledWeek.WeekWrapper onClick={onWeekWrapperClick}>
      <StyledWeek.WeekHeader expanded={expanded}>
        <StyledWeek.WeekTitle variant="subtitle2">
          <TitleText text={weekData.week.title} defaultText={defaultText} />
        </StyledWeek.WeekTitle>
        <IconButton onClick={onCollapseIconClick}>
          <KeyboardArrowDown />
        </IconButton>
      </StyledWeek.WeekHeader>

      {expanded && weekGrid}
    </StyledWeek.WeekWrapper>
  )
}

type WeekRowPropsType = {
  row: BoardWeekRowType
  parentId: number
  weekId: number
  rowIndex: number
  rowCount: number
  columnColors: WeekPropsType['columnColors']
  onRowReorder: WeekPropsType['onRowReorder']
  onReorder: WeekPropsType['onReorder']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeId: number) => void
}

type StateType = {
  edge: Edge | null
  draggedOver: boolean
}

const WeekRow = ({
  row,
  weekId,
  rowIndex,
  rowCount,
  columnColors,
  onReorder,
  onRowReorder,
  onNodeClick
}: WeekRowPropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<StateType>({
    edge: null,
    draggedOver: false
  })

  const resetState = useCallback(() => {
    setState(
      produce((draft) => {
        draft.edge = null
        draft.draggedOver = false
      })
    )
  }, [])

  useEffect(() => {
    const el = ref.current

    dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        // attach custom data for easier identifying on drop
        const data = {
          coords: {
            week: weekId,
            y: rowIndex
          },
          type: DroppableType.ROW
        }
        return attachClosestEdge(data, {
          input,
          element,
          allowedEdges: ['top', 'bottom']
        })
      },
      onDrag: ({ self, source }) => {
        const edge: Edge = extractClosestEdge(self.data)
        const fromData = source.data
        const toData = self.data

        if (!isGridCell(fromData) || !isGridRow(toData)) {
          return
        }

        if (fromData.coords.week === toData.coords.week) {
          // hide the top indicator for the top-most row
          if (fromData.coords.y === 0 && edge === 'top') {
            return
          }

          // and the bottom indicator when dragging the bottom-most row
          if (
            fromData.coords.y === toData.coords.y &&
            toData.coords.y === rowCount - 1 &&
            edge === 'bottom'
          ) {
            return
          }
        }

        setState(
          produce((draft) => {
            if (draft.edge !== edge) {
              draft.edge = edge
            }
            draft.draggedOver = true
          })
        )
      },
      onDrop: ({ self, source }) => {
        const edge: Edge = extractClosestEdge(self.data)
        const fromData = source.data
        const toData = self.data

        if (!isGridCell(fromData) || !isGridRow(toData)) {
          return
        }

        const from = {
          week: fromData.coords.week,
          y: fromData.coords.y
        }

        const to = {
          week: toData.coords.week,
          y: toData.coords.y
        }

        if (from.week === to.week) {
          // early exit if nothing changed
          if (from.y === to.y) {
            resetState()
            return
          }

          // if we've triggered the 'top' side of the row, we still want
          // to nest the dragged item between it and the previous row
          if (edge === 'top') {
            if (from.y < to.y) {
              to.y = Math.max(0, to.y - 1)
            }
          }

          // same as above, but for the bottom edge
          if (edge === 'bottom') {
            if (from.y > to.y) {
              to.y = Math.min(rowCount, to.y + 1)
            }
          }
        } else {
          // if we've triggered the 'top' side of the row, we still want
          // to nest the dragged item between it and the previous row
          if (edge === 'top') {
            to.y = Math.max(0, to.y - 1)
          }

          // same as above, but for the bottom edge
          if (edge === 'bottom') {
            to.y = Math.min(rowCount, to.y + 1)
          }
        }

        onRowReorder(from, to)
        resetState()
      },
      onDragLeave: resetState
    })
  }, [weekId, rowIndex, rowCount, onRowReorder, resetState])

  // show a 'drag things into this container' message if nothing is being dragged
  // and all the nodes for this row are phantom nodes
  if (
    rowCount === 1 &&
    row.every((node) => node === 'phantom') &&
    !state.draggedOver
  ) {
    return (
      <Styled.CellRow ref={ref}>
        <span style={{ minHeight: 50 }}>
          Drag nodes from the sidebar or other parts to add them here.
        </span>
      </Styled.CellRow>
    )
  }

  // don't render empty phantom rows unless it's the only empty row in the week/part
  // but still need to supply the ref to make drag listeners happy hence the empty div
  if (rowCount !== 1 && row.every((node) => node === 'phantom')) {
    return (
      <Styled.CellRow ref={ref} style={{ display: 'none' }}>
        <Styled.CellRowIndicator edge={state.edge} />
      </Styled.CellRow>
    )
  }

  return (
    <Styled.CellRow ref={ref}>
      <Styled.CellRowIndicator edge={state.edge} />
      {row.map((node, nodeIndex) => (
        <Fragment key={`${weekId}_${rowIndex}_${nodeIndex}`}>
          {node === 'phantom' ? (
            <WeekCell
              type="phantom"
              coords={{
                week: weekId,
                x: nodeIndex,
                y: rowIndex
              }}
              borderColor={columnColors[nodeIndex]}
              onReorder={onReorder}
            />
          ) : (
            <WeekCell
              type="node"
              coords={{
                week: weekId,
                x: nodeIndex,
                y: rowIndex
              }}
              borderColor={columnColors[nodeIndex]}
              title={node.title}
              description={node.description}
              onClick={(e) => onNodeClick(e, node.id)}
            />
          )}
        </Fragment>
      ))}
    </Styled.CellRow>
  )
}

export default Week
