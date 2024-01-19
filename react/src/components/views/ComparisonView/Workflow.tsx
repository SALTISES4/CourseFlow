import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithSorting } from '@cfParentComponents'
import * as Utility from '@cfUtility'

import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator'
import { CfObjectType } from '@cfModule/types/enum'
import WeekWorkflowComparison from '@cfViews/ComparisonView/WeekWorkflowComparison'
import { AppState } from '@cfRedux/type'
import { EditableComponentWithSortingState } from '@cfParentComponents/EditableComponentWithSorting'
// import $ from 'jquery'

type ConnectedProps = {
  data: any
  object_sets: any
}
type OwnProps = {
  objectID: number
}
type StateProps = EditableComponentWithSortingState
type PropsType = ConnectedProps & OwnProps

//Basic component representing the workflow
class WorkflowUnconnected extends EditableComponentWithSorting<
  PropsType,
  StateProps
> {
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDragAndDrop()
  }

  componentDidUpdate() {
    this.makeDragAndDrop()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDragAndDrop() {
    this.makeSortableNode(
      $('.week-block').children('.week-workflow').not('.ui-draggable'),
      this.props.objectID,
      'weekworkflow',
      '.week-workflow',
      false,
      false,
      '#workflow-' + this.props.data.id,
      '.week',
      '.week-block'
    )
  }

  stopSortFunction() {
    Utility.triggerHandlerEach($('.week .node'), 'component-updated')
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    if (type === 'weekworkflow') {
      this.context.micro_update(
        ActionCreator.moveWeekWorkflow(id, new_position, new_parent, child_id)
      )
      insertedAt(
        this.context, // dragaction
        child_id,
        'week',
        new_parent,
        'workflow',
        new_position,
        'weekworkflow'
      )
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const weekworkflows = data.weekworkflow_set.map((weekworkflow) => (
      <WeekWorkflowComparison
        condensed={data.condensed}
        key={weekworkflow}
        objectID={weekworkflow}
        parentID={data.id}
        // renderer={renderer}
      />
    ))

    return (
      <div className="workflow-details">
        <div className="week-block" id={data.id + '-week-block'}>
          {weekworkflows}
        </div>
      </div>
    )
  }
}

const mapWorkflowStateToProps = (state: AppState): ConnectedProps => {
  return {
    data: state.workflow,
    object_sets: state.objectset
  }
}

const Workflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWorkflowStateToProps,
  null
)(WorkflowUnconnected)

export default Workflow
