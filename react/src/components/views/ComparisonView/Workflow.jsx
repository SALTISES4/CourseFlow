import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithSorting } from '@cfParentComponents'
import * as Utility from '@cfUtility'

import WeekWorkflow from './WeekWorkflow'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator.ts'
// import $ from 'jquery'

//Basic component representing the workflow
class WorkflowUnconnected extends EditableComponentWithSorting {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
    this.state = {}
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
      this.props.renderer.micro_update(
        ActionCreator.moveWeekWorkflow(id, new_position, new_parent, child_id)
      )
      insertedAt(
        this.props.renderer,
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
    const renderer = this.props.renderer
    const weekworkflows = data.weekworkflow_set.map((weekworkflow) => (
      <WeekWorkflow
        condensed={data.condensed}
        key={weekworkflow}
        objectID={weekworkflow}
        parentID={data.id}
        renderer={renderer}
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

const mapWorkflowStateToProps = (state) => ({
  data: state.workflow,
  object_sets: state.objectset
})

const Workflow = connect(mapWorkflowStateToProps, null)(WorkflowUnconnected)

export default Workflow
