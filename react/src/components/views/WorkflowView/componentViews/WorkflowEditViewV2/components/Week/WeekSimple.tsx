import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { AppState } from '@cfRedux/types/type'
import WorkflowFunctions from '@cfViews/WorkflowView/componentViews/WorkflowEditView/workflow.actions.class'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { produce } from 'immer'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'
import { Cell, CellRow } from '../../styles'
import * as StyledNode from '../Node/styles'

import { PropsType } from './'

type NodeMatrixType = {
  id: string
  title?: string
  description?: string
}[][]

const nodeMatrix: NodeMatrixType = [
  [
    { id: 'row-1_1' },
    {
      id: 'row-1_2',
      title: 'Omg',
      description: 'I am descriptors'
    },
    { id: 'row-1_3' },
    { id: 'row-1_4' },
    { id: 'row-1_5' }
  ],
  [
    { id: 'row-2_1' },
    { id: 'row-2_2' },
    {
      id: 'row-2_3',
      title: 'Glass Beams',
      description: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit'
    },
    { id: 'row-2_4' },
    { id: 'row-2_5' }
  ],
  [
    { id: 'row-3_1' },
    { id: 'row-3_2' },
    { id: 'row-3_3' },
    {
      id: 'row-3_4',
      title: 'What le fonk',
      description: 'I am descriptors'
    },
    { id: 'row-3_5' }
  ]
]

const WeekSimple = ({
  objectId,
  parentId,
  columnColors
}: Omit<PropsType, 'reordering'>) => {
  const dispatch = useDispatch()
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, objectId)
  )

  const workflow = useSelector((state: AppState) => state.workflow)
  const [state, setState] = useState({
    nodes: weekData.week.nodes || [],
    dndMatrix: nodeMatrix,
    expanded: true
  })

  const manager = useRef(new BetterSelectionManager(dispatch))

  const onNodeDragEnd = (event) => {
    // const oldIndex = state.nodes.indexOf(active.id as number)
    // const newIndex = state.nodes.indexOf(over.id as number)
    // const reorderedNodes = WorkflowFunctions.reorderArray(
    //   state.nodes,
    //   oldIndex,
    //   newIndex
    // )
    // setState(
    //   produce((draft) => {
    //     draft.nodes = reorderedNodes
    //   })
    // )
  }

  const onWeekWrapperClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      manager.current.updateSidebar(
        weekData.week.id,
        CfObjectType.WEEK,
        parentId
      )
    },
    [parentId, weekData.week.id]
  )

  const onCollapseIconClick = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setState(
      produce((draft) => {
        draft.expanded = !draft.expanded
      })
    )
  }, [])

  const defaultText = !workflow.isStrategy
    ? `${weekData.week.weekTypeDisplay} ${weekData.week.order + 1}`
    : undefined

  return (
    <Styled.WeekWrapper onClick={onWeekWrapperClick}>
      <Styled.WeekHeader expanded={state.expanded}>
        <Styled.WeekTitle variant="subtitle2">
          <TitleText text={weekData.week.title} defaultText={defaultText} />
        </Styled.WeekTitle>
        <IconButton onClick={onCollapseIconClick}>
          <KeyboardArrowDown />
        </IconButton>
      </Styled.WeekHeader>

      {state.expanded && (
        <div id={`${objectId}-node-block`} className="node-block">
          <DragDropContext onDragEnd={onNodeDragEnd}>
            <Droppable
              key={`droppable-${objectId}`}
              droppableId={`droppable-${objectId}`}
              direction="horizontal"
            >
              {(droppableProvided, droppableSnapshot) => (
                <>
                  {state.dndMatrix.map((nodeMatrixRow, nodeMatrixRowIndex) => (
                    <CellRow
                      id={`${objectId}-row-${nodeMatrixRowIndex}`}
                      key={`row-${nodeMatrixRowIndex}`}
                      ref={droppableProvided.innerRef}
                    >
                      {nodeMatrixRow.map((nodeData, nodeIndex) => (
                        <Draggable
                          key={nodeData.id}
                          draggableId={`node-id-${nodeData.id}`}
                          index={nodeIndex}
                        >
                          {(draggableProvided, draggableSnapshot) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              style={
                                !nodeData.title
                                  ? {
                                      opacity: 0.3,
                                      pointerEvents: 'none'
                                    }
                                  : {}
                              }
                            >
                              <Cell>
                                <StyledNode.Border
                                  {...draggableProvided.dragHandleProps}
                                  // style={getItemStyle(
                                  //   draggableSnapshot.isDragging,
                                  // )}
                                  sx={{
                                    backgroundColor: columnColors[nodeIndex]
                                  }}
                                />
                                <StyledNode.Content>
                                  {nodeData.title ? (
                                    <>
                                      <StyledNode.Title variant="subtitle2">
                                        {nodeData.title}
                                      </StyledNode.Title>
                                      <StyledNode.Subtitle variant="caption">
                                        {nodeData.description}
                                      </StyledNode.Subtitle>
                                    </>
                                  ) : (
                                    <StyledNode.Title variant="subtitle2">
                                      {nodeData.id}
                                    </StyledNode.Title>
                                  )}
                                </StyledNode.Content>
                              </Cell>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {droppableProvided.placeholder}
                    </CellRow>
                  ))}
                </>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </Styled.WeekWrapper>
  )
}

export default WeekSimple
