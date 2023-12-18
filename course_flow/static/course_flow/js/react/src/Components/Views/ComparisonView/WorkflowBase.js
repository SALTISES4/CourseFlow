import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponent } from '@cfParentComponents'

import { toggleObjectSet } from '@cfReducers'
import { WorkflowForMenu } from '@cfCommonComponents'
import OutcomeEdit from './OutcomeEdit.js'
import Workflow from './Workflow.js'

//Container for common elements for workflows
class WorkflowBaseUnconnected extends EditableComponent {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.props.renderer.silent_connect_fail = true
    this.alignAllHeaders()
    this.addObjectSetTrigger()
  }

  componentDidUpdate() {
    this.alignAllHeaders()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  openEdit(evt) {
    this.props.renderer.selection_manager.changeSelection(evt, this)
  }

  addObjectSetTrigger() {
    let props = this.props
    $(document).off('object_set_toggled.' + this.props.data.id)
    $(document).on('object_set_toggled.' + this.props.data.id, (evt, data) => {
      props.dispatch(toggleObjectSet(data.id, data.hidden))
    })
  }

  alignAllHeaders() {
    let rank = this.props.rank + 1
    $('.comparison-view .workflow-header').css({ height: '' })
    let max_height = 0
    $('.comparison-view .workflow-header').each(function () {
      let this_height = $(this).height()
      if (this_height > max_height) max_height = this_height
    })
    $('.comparison-view .workflow-header').css({ height: max_height + 'px' })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let renderer = this.props.renderer
    let selection_manager = renderer.selection_manager

    let workflow_content
    if (renderer.view_type == 'outcomeedit') {
      workflow_content = <OutcomeEdit renderer={renderer} objectID={data.id} />
    } else {
      workflow_content = <Workflow renderer={renderer} objectID={data.id} />
    }

    let style = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }

    let workflow = this

    return [
      <div className="workflow-header" style={style}>
        <WorkflowForMenu
          workflow_data={data}
          selectAction={this.openEdit.bind(this, null)}
        />
      </div>,
      <div className="workflow-container">
        {this.addEditable(data, true)}
        {workflow_content}
      </div>
    ]
  }
}

const mapWorkflowStateToProps = (state) => ({
  data: state.workflow,
  object_sets: state.objectset
})

const WorkflowBase = connect(
  mapWorkflowStateToProps,
  null
)(WorkflowBaseUnconnected)

export default WorkflowBase
