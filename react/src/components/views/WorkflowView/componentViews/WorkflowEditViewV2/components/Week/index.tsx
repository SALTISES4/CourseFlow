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
import { BoardWeekRowType, CellReorderCallbackFn } from '../../types'
import WeekCell from '../WeekCell'

type WeekPropsType = {
  index: number
  weekId: number
  weekRows: BoardWeekRowType[]
  parentId: number
  columnIds: number[]
  columnColors: string[]
  onReorder: CellReorderCallbackFn
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
  onNodeClick
}: WeekRowPropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<StateType>({
    edge: null
  })

  // TODO: figure out debouncing
  // const onEdgeChange = useCallback(
  //   (edge: StateType['edge']) => {
  //     console.log(edge, 'for', weekId, '/', rowIndex)
  //     setState(
  //       produce((draft) => {
  //         draft.edge = edge
  //       })
  //     )
  //   },
  //   [weekId, rowIndex]
  // )

  // const debouncedEdgeChange = debounce(onEdgeChange, 200)

  useEffect(() => {
    const el = ref.current

    dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        const data = {
          itemId: 'A'
        }
        return attachClosestEdge(data, {
          input,
          element,
          allowedEdges: ['top', 'bottom']
        })
      },
      onDrag: (args) => {
        setState(
          produce((draft) => {
            draft.edge = extractClosestEdge(args.self.data)
          })
        )
      },
      onDrop: () => {
        setState({ edge: null })
      },
      onDragLeave: () => {
        setState({ edge: null })
      }
    })
  }, [])

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
