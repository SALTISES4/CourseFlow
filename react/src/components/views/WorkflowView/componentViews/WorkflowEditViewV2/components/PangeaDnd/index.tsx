import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { AppState } from '@cf/redux/types/type'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  DropResult,
  Droppable,
  DroppableProvided
} from '@hello-pangea/dnd'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { produce } from 'immer'
import { MouseEvent, useCallback, useState } from 'react'
import { ReactNode } from 'react'
import { useSelector } from 'react-redux'

import * as Styled from '../../styles'
import * as StyledNode from '../Node/styles'
import * as StyledWeek from '../Week/styles'

type PropsType = {
  columnColors: string[]
  weekIds: number[]
}

const PangeaDnd = ({ weekIds, columnColors }: PropsType) => {
  function onDragEnd(result: DropResult) {
    console.log('drag ended yo', result)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {weekIds.map((weekId, index) => (
        <div id={`week_${weekId}`} key={`week_${weekId}`}>
          <Droppable
            droppableId={`week_${weekId}`}
            direction="horizontal"
            // type="COLUMN"
            // ignoreContainerClipping={Boolean(containerHeight)}
            // isCombineEnabled={isCombineEnabled}
          >
            {(provided: DroppableProvided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <PangeaDndWeek
                  key={weekId}
                  objectId={weekId}
                  index={index}
                  parentId={1}
                  placeholder={provided.placeholder}
                  columnColors={columnColors}
                />
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </DragDropContext>
  )
}

type PangeaDndWeekProps = {
  index: number
  objectId: number
  parentId: number
  placeholder: ReactNode
  columnColors: string[]
}

const PangeaDndWeek = (props: PangeaDndWeekProps) => {
  const [state, setState] = useState({
    expanded: true
  })
  const workflow = useSelector((state: AppState) => state.workflow)
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, props.objectId)
  )

  const onWeekWrapperClick = useCallback(
    // (e: MouseEvent<HTMLDivElement>) => {
    //   e.stopPropagation()
    //   manager.current.updateSidebar(
    //     weekData.week.id,
    //     CfObjectType.WEEK,
    //     parentId
    //   )
    // },
    // [parentId, weekData.week.id]
    () => {
      console.log('wrapperClicked')
    },
    []
  )

  const onCollapseIconClick = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setState(
      produce((draft) => {
        draft.expanded = !draft.expanded
      })
    )
  }, [])

  const nodes = workflow.columns.map((columnId, index) => (
    <Draggable
      key={`${props.objectId}_${index}`}
      draggableId={`${props.objectId}_${index}`}
      index={index}
    >
      {(provided: DraggableProvided) => (
        <div ref={provided.innerRef} {...provided.draggableProps}>
          <Styled.Cell>
            <StyledNode.Border
              {...provided.dragHandleProps}
              sx={{ backgroundColor: props.columnColors[index] }}
            />
            <StyledNode.Content>
              <StyledNode.Title variant="subtitle2">
                {props.objectId}_{index}
              </StyledNode.Title>
              <StyledNode.Subtitle variant="caption">
                Some description text here
              </StyledNode.Subtitle>
            </StyledNode.Content>
          </Styled.Cell>
        </div>
      )}
    </Draggable>
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

      {state.expanded && (
        <Styled.CellRow>
          {nodes}
          {props.placeholder}
        </Styled.CellRow>
      )}
    </StyledWeek.WeekWrapper>
  )
}

export default PangeaDnd
