import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { PropsType } from '../'
import * as Styled from '../../../styles'
import type { BoardWeekRowType } from '../../../utility'
import * as StyledNode from '../../Node/styles'
import * as StyledWeek from '../../Week/styles'

type DndWeekProps = {
  index: number
  weekId: number
  weekRows: BoardWeekRowType[]
  parentId: number
  columnIds: PropsType['columnIds']
  columnColors: PropsType['columnColors']
}

const DndWeek = (props: DndWeekProps) => {
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
        <div key={`${props.weekId}_${rowIndex}_${nodeIndex}`}>
          {node === 'phantom' ? (
            <Styled.Cell sx={{ opacity: 0.2, pointerEvents: 'none' }}>
              <StyledNode.Border
                sx={{ backgroundColor: props.columnColors[nodeIndex] }}
              />
              <StyledNode.Content>
                <StyledNode.Title variant="subtitle2">
                  {props.weekId}_{rowIndex}_{nodeIndex}
                </StyledNode.Title>
              </StyledNode.Content>
            </Styled.Cell>
          ) : (
            <Styled.Cell>
              <StyledNode.Border
                sx={{ backgroundColor: props.columnColors[nodeIndex] }}
              />
              <StyledNode.Content
                onClick={(e) => {
                  e.stopPropagation()
                  manager.current.updateSidebar(
                    node.id,
                    CfObjectType.NODE,
                    props.parentId
                  )
                }}
              >
                <StyledNode.Title variant="subtitle2">
                  {node.title}
                </StyledNode.Title>
                <StyledNode.Subtitle variant="caption">
                  {node.description}
                </StyledNode.Subtitle>
              </StyledNode.Content>
            </Styled.Cell>
          )}
        </div>
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

export default DndWeek
