import { OuterContentWrap } from '@cf/mui/helper'
import { CfObjectType } from '@cf/types/enum'
import { AppDispatch, RootState } from '@cfRedux/store'
import { updateAllEntities } from '@cfRedux/thunks'
import ColumnWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/column/ColumnWrapper'
import WeekWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/WeekWrapper'
import WorkflowFunctions from '@cfViews/WorkflowView/componentViews/WorkflowEditView/workflow.actions.class'
import { DndContext } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const WorkflowEditView = () => {
  const dispatch = useDispatch<AppDispatch>()
  /*******************************************************
   * HOOKS: REDUX
   *******************************************************/
  const workflow = useSelector((state: RootState) => state.workspace.workflow)

  /*******************************************************
   * HOOKS: STATE
   *******************************************************/
  const [weeksDragState, setWeeksDragState] = useState(workflow.weeks || [])
  const [columnsDragState, setColumnsDragState] = useState(
    workflow.columns || []
  )

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const CanvasPlaceholder = () => {
    /*
      .workflow-canvas is used for all kinds of targeting
      nodes and nodelinks (drawn line connections between nodes) are added/rendered to the canvas and they seem to float on top of react
      it doesn't look like comments, nodes, weeks etc are part of the 3js stuff
      */
    return (
      <svg className="workflow-canvas" width="100%" height="100%">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
      </svg>
    )
  }

  /*******************************************************
   * DRAGGABLE COLUMNS AREAS
   *******************************************************/
  const handleColumnDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = columnsDragState.indexOf(active.id)
    const newIndex = columnsDragState.indexOf(over.id)

    const reorderedColumns = WorkflowFunctions.reorderArray(
      columnsDragState,
      oldIndex,
      newIndex
    )
    // set local state
    setWeeksDragState(reorderedColumns)
    // commit to DB
    //    WorkflowAction.
  }

  const handleColumnDragStart = () => {
    //  dispatch(updateAllEntities(CfObjectType.WEEK, () => ({ isDropped: false })))
  }

  const columns = columnsDragState.map((columnId) => (
    <ColumnWrapper
      key={`columnworkflow-${columnId}`}
      objectId={columnId}
      parentId={workflow.id}
    />
  ))

  /*******************************************************
   * DRAGGABLE WEEKS AREAS
   *******************************************************/
  const handleWeekDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = weeksDragState.indexOf(active.id)
    const newIndex = weeksDragState.indexOf(over.id)

    // calculate new order
    const reorderedWeeks: number[] = WorkflowFunctions.reorderArray(
      weeksDragState,
      oldIndex,
      newIndex
    )

    // set redux state
    dispatch(updateAllEntities(CfObjectType.WEEK, () => ({ isDropped: true })))

    // set local state
    setWeeksDragState(reorderedWeeks)

    // commit to DB
    //    WorkflowAction.
  }

  const handleWeekDragStart = () => {
    dispatch(updateAllEntities(CfObjectType.WEEK, () => ({ isDropped: false })))
  }

  /*******************************************************
   * RETURN
   *******************************************************/
  return (
    <>
      <OuterContentWrap>
        <div data-test-id="columns-block" style={{ display: 'flex' }}>
          <DndContext
            onDragEnd={handleColumnDragEnd}
            onDragStart={handleColumnDragStart}
          >
            <SortableContext
              items={columnsDragState}
              strategy={horizontalListSortingStrategy}
            >
              {columns}
            </SortableContext>
          </DndContext>
        </div>

        <div data-test-id="weeks-block">
          <DndContext
            onDragEnd={handleWeekDragEnd}
            onDragStart={handleWeekDragStart}
          >
            <SortableContext
              items={weeksDragState}
              strategy={verticalListSortingStrategy}
            >
              {weeksDragState.map((weekId) => (
                <WeekWrapper
                  condensed={false} // TODO: where does this come from?
                  key={`weekworkflow-${weekId}`}
                  objectId={weekId}
                  parentId={workflow.id}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </OuterContentWrap>
      <CanvasPlaceholder />
    </>
  )
}

export default WorkflowEditView

// import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
// import { CfObjectType } from '@cf/types/enum'
// import ThemeHelper from '@cf/utility/ThemeHelper.class'
// import EditableComponentWithSorting, {
//   EditableComponentWithSortingProps,
//   EditableComponentWithSortingState
// } from '@cfEditableComponents/EditableComponentWithSorting'
// import ActionCreator from '@cfRedux/ActionCreator'
// import { AppState } from '@cfRedux/types/type'
// import ColumnWorkflow from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/column/ColumnWorkflow'
// import WeekWorkflow from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/WeekWorkflow'
// import { insertedAt } from '@XMLHTTP/postTemp.jsx'
// import * as React from 'react'
// import { connect } from 'react-redux'
//
// // import $ from 'jquery'
//
// type ConnectedProps = {
//   data: AppState['workflow']
//   objectSets: AppState['objectSet']
//   week: AppState['week']
//   node: AppState['node']
//   outcome: AppState['outcome']
// }
// type OwnProps = EditableComponentWithSortingProps
// type StateProps = EditableComponentWithSortingState
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  * The workflow view with drag and drop nodes/weeks/columns
//  * ...
//  * what view is this?
//  */
// class WorkflowEditViewUnconnected extends EditableComponentWithSorting<
//   PropsType,
//   StateProps
// > {
//   static contextType = WorkflowConfigContext
//   declare context: React.ContextType<typeof WorkflowConfigContext>
//
//   constructor(props: PropsType) {
//     super(props)
//     this.state = {} as StateProps
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//
//     const columnworkflows = data.columnworkflowSet?.map(
//       (columnworkflow, index) => (
//         <ColumnWorkflow
//           key={`columnworkflow-${columnworkflow}`}
//           objectId={columnworkflow}
//           parentId={data.id}
//         />
//       )
//     )
//     const weekworkflows = data.weekworkflowSet?.map((weekworkflow, index) => (
//       <WeekWorkflow
//         condensed={data.condensed}
//         key={`weekworkflow-${weekworkflow}`}
//         objectId={weekworkflow}
//         parentId={data.id}
//       />
//     ))
//
//     let cssClass = 'workflow-details'
//     if (data.condensed) {
//       cssClass += ' condensed'
//     }
//
//     // We render an svg canvas in front of the rest of
//     // the workflow for drawing node ports and links
//     return (
//       <div className={cssClass}>
//         <div className="column-row" id={data.id + '-column-block'}>
//           {columnworkflows}
//         </div>
//         <div className="week-block" id={data.id + '-week-block'}>
//           {weekworkflows}
//         </div>
//         {/*
//         PLACEHOLDER PORTAL TARGET FOR ALL KINDS OF STUFF
//         */}
//         <svg className="workflow-canvas" width="100%" height="100%">
//           <defs>
//             <marker
//               id="arrow"
//               viewBox="0 0 10 10"
//               refX="10"
//               refY="5"
//               markerWidth="4"
//               markerHeight="4"
//               orient="auto-start-reverse"
//             >
//               <path d="M 0 0 L 10 5 L 0 10 z" />
//             </marker>
//           </defs>
//         </svg>
//       </div>
//     )
//   }
// }
// const mapStateToProps = (state: AppState): ConnectedProps => ({
//   data: state.workflow,
//   objectSets: state.objectSet,
//   week: state.week,
//   node: state.node,
//   outcome: state.outcome
// })
//
// const WorkflowEditView = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(WorkflowEditViewUnconnected)
//
// export default WorkflowEditView
