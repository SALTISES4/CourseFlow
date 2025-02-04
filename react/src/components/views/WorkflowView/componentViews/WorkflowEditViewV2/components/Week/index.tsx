import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { Fragment, MouseEvent, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as StyledWeek from './styles'
import * as Styled from '../../styles'
import { BoardWeekRowType, CellReorderCallbackFn } from '../../types'
import WeekCell from '../WeekCell'

type WeekProps = {
  index: number
  weekId: number
  weekRows: BoardWeekRowType[]
  parentId: number
  columnIds: number[]
  columnColors: string[]
  onReorder: CellReorderCallbackFn
}

const Week = (props: WeekProps) => {
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
    <Styled.CellRow key={`week_${props.weekId}_${rowIndex}`}>
      {row.map((node, nodeIndex) => (
        <Fragment key={`${props.weekId}_${rowIndex}_${nodeIndex}`}>
          {node === 'phantom' ? (
            <WeekCell
              type="phantom"
              coords={{
                week: props.weekId,
                x: nodeIndex,
                y: rowIndex
              }}
              borderColor={props.columnColors[nodeIndex]}
              onReorder={props.onReorder}
            />
          ) : (
            <WeekCell
              type="node"
              coords={{
                week: props.weekId,
                x: nodeIndex,
                y: rowIndex
              }}
              borderColor={props.columnColors[nodeIndex]}
              title={node.title}
              description={node.description}
              onClick={(e) => onNodeClick(e, node.id)}
            />
          )}
        </Fragment>
      ))}
    </Styled.CellRow>
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

export default Week
