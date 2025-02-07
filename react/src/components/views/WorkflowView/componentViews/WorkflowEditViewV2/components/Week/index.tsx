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
  columnColors: WeekPropsType['columnColors']
  onRowReorder: WeekPropsType['onRowReorder']
  onReorder: WeekPropsType['onReorder']
  onNodeClick: (e: MouseEvent<HTMLDivElement>, nodeId: number) => void
}

type StateType = {
  edge: Edge | null
}

const WeekRow = ({
  row,
  weekId,
  rowIndex,
  columnColors,
  onReorder,
  onRowReorder,
  onNodeClick
}: WeekRowPropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<StateType>({
    edge: null
  })

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
      onDrag: ({ self }) => {
        setState(
          produce((draft) => {
            draft.edge = extractClosestEdge(self.data)
          })
        )
      },
      onDrop: ({ self, source }) => {
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

        // early exit if nothing changed
        if (from.week === to.week && from.y === to.y) {
          setState({ edge: null })
          return
        }

        onRowReorder(from, to)
        setState({ edge: null })
      },
      onDragLeave: () => {
        setState({ edge: null })
      }
    })
  }, [weekId, rowIndex, onRowReorder])

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
