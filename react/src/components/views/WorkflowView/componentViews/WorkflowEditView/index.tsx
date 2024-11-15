import { AppState } from '@cfRedux/types/type'
import ColumnWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/column/ColumnWrapper'
import WeekWrapper from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/WeekWrapper'
import { DndContext } from '@dnd-kit/core'
import { verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import clsx from 'clsx'
import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'

// Utility function to reorder an array
const reorderArray = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

const WorkflowEditView = () => {
  /*******************************************************
   * HOOKS: REDUX
   *******************************************************/
  const workflow = useSelector((state: AppState) => state.workflow)
  const [weeksDragState, setWeeksDragState] = React.useState(
    workflow.weeks || []
  )

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const columns = workflow.columns?.map((columnId) => (
    <ColumnWrapper
      key={`columnworkflow-${columnId}`}
      objectId={columnId}
      parentId={workflow.id}
    />
  ))

  const weeks = weeksDragState.map((weekId) => {
    return (
      <WeekWrapper
        id={weekId}
        key={`weekworkflow-${weekId}`}
        objectId={weekId}
        parentId={workflow.id}
        condensed={workflow.condensed} // this makes no sense that it would switch on condensed
      />
    )
  })

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

  // Updated handleDragEnd function
  const handleDragEnd = (event) => {
    console.log('ended')
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = weeksDragState.indexOf(active.id)
    const newIndex = weeksDragState.indexOf(over.id)

    // Reorder weeks array
    const reorderedWeeks = reorderArray(weeksDragState, oldIndex, newIndex)
    setWeeksDragState(reorderedWeeks)
  }

  const sayHello = () => {
    console.log('sayHello')
  }

  /*******************************************************
   * RETURN
   *******************************************************/
  return (
    <div
      className={clsx('workflow-details', {
        condensed: workflow.condensed
      })}
    >
      {/*
      .column-row is used as a UX/jquery target
    */}
      <div className="column-row" id={workflow.id + '-column-block'}>
        {columns}
      </div>

      {/*
      .week-block is used as a UX/jquery target
    */}
      {/*<div className="week-block" id={workflow.id + '-week-block'}>*/}
      {/*  {weeks}*/}
      {/*</div>*/}

      <DndContext onDragEnd={handleDragEnd} onDragStart={sayHello}>
        <SortableContext
          items={weeksDragState}
          strategy={verticalListSortingStrategy}
        >
          <div className="week-block" id={`${workflow.id}-week-block`}>
            {weeks}
          </div>
        </SortableContext>
      </DndContext>

      <CanvasPlaceholder />
    </div>
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
//   objectSets: AppState['objectset']
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
//   objectSets: state.objectset,
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
