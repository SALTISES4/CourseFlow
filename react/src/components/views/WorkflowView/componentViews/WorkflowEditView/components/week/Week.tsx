import { CfObjectType } from '@cf/types/enum'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { weekChangeField } from '@cfRedux/slices/week.slice'
import { RootState } from '@cfRedux/store'
import NodeWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeWrapper'
import StrategyTabIcon from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/components/StrategyTabIcon'
import WorkflowFunctions from '@cfViews/WorkflowView/componentViews/WorkflowEditView/workflow.actions.class'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import IconButton from '@mui/material/IconButton'
import clsx from 'clsx'
import { useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import DroppableCell from '../DroppableCell'
import * as Styled from './styles'
import { Cell, CellRow, DebugCellInfo } from '../../styles'

type PropsType = {
  objectId: number
  parentId: number
  reordering: boolean
}

export type WeekUnconnectedPropsType = PropsType

/**
 *
 **/
const Week = ({ objectId, parentId, reordering = false }: PropsType) => {
  /*******************************************************
   * REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const week = useSelector((state: RootState) =>
    selectWeekById(state, objectId)
  )
  const sidebarDragTarget = useSelector(
    (state: RootState) => state.sidebar.dragging.target // @todo @aleksander this does not exist any more,  what is dragging target ?
  )
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  /*******************************************************
   * HOOKS: STATE
   *******************************************************/
  const [nodesDragState, setNodesDragState] = useState(week.nodes || [])

  /*******************************************************
   * REFS
   *******************************************************/
  const nodeBlock = useRef(null)
  const mainDiv = useRef(null)
  const manager = useRef(new BetterSelectionManager(dispatch))

  /*******************************************************
   * DRAGGABLE NODES
   *******************************************************/
  const handleNodeDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = nodesDragState.indexOf(active.id)
    const newIndex = nodesDragState.indexOf(over.id)

    const reorderedColumns = WorkflowFunctions.reorderArray(
      nodesDragState,
      oldIndex,
      newIndex
    )
    // set local state
    setNodesDragState(reorderedColumns)
    // commit to DB
    //    WorkflowAction.
  }

  const handleNodeDragStart = () => {
    //  dispatch(updateAllEntities(CfObjectType.WEEK, () => ({ isDropped: false })))
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const Nodes = () => {
    if (!nodesDragState?.length) {
      return (
        <CellRow sx={{ position: 'relative' }}>
          {/* <Styled.EmptyText>
            Drag and drop nodes from the sidebar to add.
          </Styled.EmptyText> */}

          {workflow.columns.map((colNum) => (
            <DroppableCell
              key={colNum}
              groupId={week.id}
              coords={{
                row: 0,
                column: colNum
              }}
            >
              <Cell sx={{ height: 64 }}>
                <DebugCellInfo>row: 0, col: {colNum}</DebugCellInfo>
              </Cell>
            </DroppableCell>
          ))}
        </CellRow>
      )
    }

    return nodesDragState.map((nodeId, row) => (
      <CellRow key={`node-${nodeId}`}>
        <NodeWrapper objectId={nodeId} parentId={week.id} row={row} />
      </CellRow>
    ))
  }

  const defaultText = !workflow.isStrategy
    ? `${week.weekTypeDisplay} ${week.order + 1}`
    : undefined

  const toggleCollapse = useCallback((evt) => {
    evt.stopPropagation()
    dispatch(
      weekChangeField({
        id: objectId,
        data: { isDropped: !week.isDropped }
      })
    )
  }, [])

  // always collapse if reordering is ongoing, otherwise rely on week data
  const expanded = reordering === true ? false : week.isDropped

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <Styled.WeekWrapper
      style={ThemeHelper.getBorderStyle({
        isLocked: week?.lock?.lock,
        colour: week?.lock?.userColour
      })}
      className={clsx('week', {
        strategy: week.isStrategy,
        dropped: week.isDropped,
        [`locked`]: week?.lock,
        [`locked-${week.lock?.userId}`]: week.lock
      })}
      //      ref={mainDiv}
      onClick={(e) => {
        e.stopPropagation()
        manager.current.updateSidebar(week.id, CfObjectType.WEEK, parentId)
      }}
    >
      <Styled.WeekHeader expanded={expanded}>
        <Styled.WeekTitle variant="subtitle2">
          <TitleText text={week.title} defaultText={defaultText} />
        </Styled.WeekTitle>
        <IconButton
          onClick={toggleCollapse}
          sx={{ opacity: reordering ? 0 : 1 }}
        >
          <KeyboardArrowDown />
        </IconButton>
      </Styled.WeekHeader>

      {/*
       .node-block being used
       as jquery target for drag and drop
       and css
      */}

      {expanded && (
        <div
          id={`${objectId}-node-block`}
          className="node-block"
          ref={nodeBlock}
        >
          {sidebarDragTarget ? (
            <Nodes />
          ) : (
            <DndContext
              onDragEnd={handleNodeDragEnd}
              onDragStart={handleNodeDragStart}
            >
              <SortableContext
                items={nodesDragState}
                strategy={rectSortingStrategy}
              >
                <Nodes />
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
      <StrategyTabIcon strategyClassification={week.strategyClassification} />
    </Styled.WeekWrapper>
  )
}

export default Week
