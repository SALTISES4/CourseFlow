import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import {
  Draggable,
  DraggableProvided,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot
} from '@hello-pangea/dnd'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { produce } from 'immer'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { PropsType } from '../'
import { getWeekNodesData } from './utility'
import * as Styled from '../../../styles'
import * as StyledNode from '../../Node/styles'
import { getNodeTitle } from '../../Node/utility'
import * as StyledWeek from '../../Week/styles'

type DndWeekProps = {
  index: number
  objectId: number
  parentId: number
  columnIds: PropsType['columnIds']
  columnColors: PropsType['columnColors']
}

const DndWeek = (props: DndWeekProps) => {
  const dispatch = useDispatch()
  const [state, setState] = useState({
    expanded: true
  })
  const workflow = useSelector((state: AppState) => state.workflow)
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, props.objectId)
  )

  const manager = useRef(new BetterSelectionManager(dispatch))

  const weekRows = getWeekNodesData(weekData.week, props.columnIds)

  const onWeekWrapperClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      manager.current.updateSidebar(
        weekData.week.id,
        CfObjectType.WEEK,
        props.parentId
      )
    },
    [props.parentId, weekData.week.id]
  )

  const onCollapseIconClick = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setState(
      produce((draft) => {
        draft.expanded = !draft.expanded
      })
    )
  }, [])

  const weekGrid = weekRows.map((row, rowIndex) => (
    <Droppable
      key={`week_${props.objectId}_${rowIndex}`}
      droppableId={`week_${props.objectId}_${rowIndex}`}
      direction="horizontal"
    >
      {(
        dropProvided: DroppableProvided,
        dropSnapshot: DroppableStateSnapshot
      ) => (
        <Styled.CellRow
          ref={dropProvided.innerRef}
          {...dropProvided.droppableProps}
          sx={{
            backgroundColor: dropSnapshot.isDraggingOver
              ? '#beffcb'
              : 'transparent'
          }}
        >
          {row.map((node, nodeIndex) => (
            <Draggable
              key={`${props.objectId}_${rowIndex}_${nodeIndex}`}
              draggableId={`${props.objectId}_${rowIndex}_${nodeIndex}`}
              index={nodeIndex}
            >
              {(dragProvided: DraggableProvided) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                >
                  {node === 'phantom' ? (
                    <Styled.Cell sx={{ opacity: 0.2, pointerEvents: 'none' }}>
                      <StyledNode.Border
                        {...dragProvided.dragHandleProps}
                        sx={{ backgroundColor: props.columnColors[nodeIndex] }}
                      />
                      <StyledNode.Content>
                        <StyledNode.Title variant="subtitle2">
                          {props.objectId}_{rowIndex}_{nodeIndex}
                        </StyledNode.Title>
                      </StyledNode.Content>
                    </Styled.Cell>
                  ) : (
                    <Styled.Cell>
                      <StyledNode.Border
                        {...dragProvided.dragHandleProps}
                        sx={{ backgroundColor: props.columnColors[nodeIndex] }}
                      />
                      <StyledNode.Content
                        onClick={(e) => {
                          e.stopPropagation()
                          manager.current.updateSidebar(
                            node.node.id,
                            CfObjectType.NODE,
                            props.parentId
                          )
                        }}
                      >
                        <StyledNode.Title variant="subtitle2">
                          {getNodeTitle(node.node)}
                        </StyledNode.Title>
                        <StyledNode.Subtitle variant="caption">
                          {node.node.description}
                        </StyledNode.Subtitle>
                      </StyledNode.Content>
                    </Styled.Cell>
                  )}
                </div>
              )}
            </Draggable>
          ))}
          {dropProvided.placeholder}
        </Styled.CellRow>
      )}
    </Droppable>
  ))

  const defaultText = !workflow.isStrategy
    ? `${weekData.week.weekTypeDisplay} ${weekData.week.order + 1}`
    : undefined

  return (
    <StyledWeek.WeekWrapper onClick={onWeekWrapperClick}>
      <StyledWeek.WeekHeader expanded={state.expanded}>
        <StyledWeek.WeekTitle variant="subtitle2">
          <TitleText text={weekData.week.title} defaultText={defaultText} />
        </StyledWeek.WeekTitle>
        <IconButton onClick={onCollapseIconClick}>
          <KeyboardArrowDown />
        </IconButton>
      </StyledWeek.WeekHeader>

      {state.expanded && weekGrid}
    </StyledWeek.WeekWrapper>
  )
}

export default DndWeek
