// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponent } from '@cfParentComponents'

import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import OutcomeEdit from './OutcomeEdit'
import Workflow from './Workflow'
import ActionCreator from '@cfRedux/ActionCreator'
import { CfObjectType, ViewType } from '@cfModule/types/enum.js'
import { AppState } from '@cfRedux/type'
// import $ from 'jquery'

//Container for common elements for workflows
class WorkflowBaseUnconnected extends EditableComponent {
  constructor(props) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW
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
    const props = this.props
    $(document).off('object_set_toggled.' + this.props.data.id)
    $(document).on('object_set_toggled.' + this.props.data.id, (evt, data) => {
      props.dispatch(ActionCreator.toggleObjectSet(data.id, data.hidden))
    })
  }

  alignAllHeaders() {
    const rank = this.props.rank + 1
    $('.comparison-view .workflow-header').css({ height: '' })
    let max_height = 0
    $('.comparison-view .workflow-header').each(function () {
      const this_height = $(this).height()
      if (this_height > max_height) max_height = this_height
    })
    $('.comparison-view .workflow-header').css({ height: max_height + 'px' })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  Content = () => {
    const data = this.props.data
    const renderer = this.props.renderer

    if (renderer.view_type === ViewType.OUTCOME_EDIT) {
      return <OutcomeEdit renderer={renderer} objectID={data.id} />
    }
    return <Workflow renderer={renderer} objectID={data.id} />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    //  const renderer = this.props.renderer
    // const selection_manager = renderer.selection_manager

    const style: React.CSSProperties = {
      border: data.lock ? '2px solid ' + data.lock.user_colour : undefined // @todo not sure what the best default state is for this
    }

    return (
      <>
        {this.addEditable(data, true)}
        <div className="workflow-header" style={style}>
          <WorkflowCard
            workflowData={data}
            selectAction={this.openEdit.bind(this, null)}
          />
        </div>
        <div className="workflow-container">
          <this.Content />
        </div>
      </>
    )
  }
}

const mapStateToProps = (state: AppState) => ({
  data: state.workflow,
  object_sets: state.objectset
})

const WorkflowBase = connect(mapStateToProps, null)(WorkflowBaseUnconnected)

export default WorkflowBase
