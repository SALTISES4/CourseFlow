import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { AppState } from '@cfRedux/types/type'
import NodeWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeWrapper'
import WorkflowFunctions from '@cfViews/WorkflowView/componentViews/WorkflowEditView/workflow.actions.class'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import { produce } from 'immer'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'
import { Cell, CellRow, DebugCellInfo } from '../../styles'
import DroppableCell from '../Cell'

import { PropsType } from './'

const WeekSimple = ({ objectId, parentId }: Omit<PropsType, 'reordering'>) => {
  const dispatch = useDispatch()
  const weekData = useSelector((state: AppState) =>
    selectWeekById(state, objectId)
  )
  const sidebarDragTarget = useSelector(
    (state: AppState) => state.sidebar.dragging.target
  )
  const workflow = useSelector((state: AppState) => state.workflow)
  const [state, setState] = useState({
    nodes: weekData.week.nodes || [],
    expanded: true
  })

  const manager = useRef(new BetterSelectionManager(dispatch))

  const onNodeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = state.nodes.indexOf(active.id as number)
    const newIndex = state.nodes.indexOf(over.id as number)
    const reorderedNodes = WorkflowFunctions.reorderArray(
      state.nodes,
      oldIndex,
      newIndex
    )

    setState(
      produce((draft) => {
        draft.nodes = reorderedNodes
      })
    )
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

  const Nodes = () => {
    if (!state.nodes.length) {
      return (
        <CellRow>
          {sidebarDragTarget ? (
            workflow.columns.map((colNum) => (
              <DroppableCell
                key={colNum}
                groupId={weekData.week.id}
                coords={{
                  row: 0,
                  column: colNum
                }}
              >
                <Cell sx={{ height: 64 }}>
                  <DebugCellInfo>row: 0, col: {colNum}</DebugCellInfo>
                </Cell>
              </DroppableCell>
            ))
          ) : (
            <Styled.EmptyText>
              Drag and drop nodes from the sidebar to add.
            </Styled.EmptyText>
          )}
        </CellRow>
      )
    }

    return state.nodes.map((nodeId, row) => (
      <CellRow key={`node-${nodeId}`}>
        <NodeWrapper objectId={nodeId} parentId={weekData.week.id} row={row} />
      </CellRow>
    ))
  }

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
          {sidebarDragTarget ? (
            <Nodes />
          ) : (
            <DndContext onDragEnd={onNodeDragEnd}>
              <SortableContext
                items={state.nodes}
                strategy={rectSortingStrategy}
              >
                <Nodes />
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </Styled.WeekWrapper>
  )
}

export default WeekSimple
