import { AppState } from '@cfRedux/types/type'
import ColumnWorkflow from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/column/ColumnWorkflow'
import WeekWorkflow from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/week/WeekWorkflow'
import clsx from 'clsx'
import React from 'react'
import { useSelector } from 'react-redux'

const WorkflowEditView = () => {
  /*******************************************************
   *
   *******************************************************/
  const { workflow, objectset, week, node, outcome } = useSelector(
    (state: AppState) => ({
      workflow: state.workflow,
      objectset: state.objectset,
      week: state.week,
      node: state.node,
      outcome: state.outcome
    })
  )

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const columnworkflows = workflow.columnworkflowSet?.map((columnworkflow) => (
    <ColumnWorkflow
      key={`columnworkflow-${columnworkflow}`}
      objectId={columnworkflow}
      parentId={workflow.id}
    />
  ))

  const weekworkflows = workflow.weekworkflowSet?.map((weekworkflow) => (
    <WeekWorkflow
      condensed={workflow.condensed}
      key={`weekworkflow-${weekworkflow}`}
      objectId={weekworkflow}
      parentId={workflow.id}
    />
  ))

  const CanvasPlaceholder = () => {
    /*
      .workflow-canvas is used for all kinds of targeting
      nodes and nodelinks are added to the canvas
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
   * RETURN
   *******************************************************/
  return (
    <div
      className={clsx('workflow-details', {
        condensed: workflow.condensed
      })}
    >
      {/*
      .column-row is used as a UX target
    */}
      <div className="column-row" id={workflow.id + '-column-block'}>
        {columnworkflows}
      </div>

      {/*
      .week-block is used as a UX target
    */}
      <div className="week-block" id={workflow.id + '-week-block'}>
        {weekworkflows}
      </div>

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
