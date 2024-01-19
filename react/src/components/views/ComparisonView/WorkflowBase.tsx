import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponent } from '@cfParentComponents'

import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import OutcomeEdit from './OutcomeEdit'
import Workflow from './Workflow'
import ActionCreator from '@cfRedux/ActionCreator'
import { CfObjectType, ViewType } from '@cfModule/types/enum.js'
import { AppState } from '@cfRedux/type'
import { EditableComponentStateType } from '@cfParentComponents/EditableComponent'
// import $ from 'jquery'

type ConnectedProps = {
  data: any
  object_sets: any
}
type OwnProps = {
  rank?: number
  // dispatch: any
  view_type: ViewType
}
type StateProps = EditableComponentStateType
type PropsType = ConnectedProps & OwnProps

//Container for common elements for workflows
class WorkflowBaseUnconnected extends EditableComponent<PropsType, StateProps> {
  constructor(props) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    // not sure
    // @ts-ignore @todo is this defined should it not be on websockets object?
    this.context.silent_connect_fail = true
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
    this.context.selection_manager.changeSelection(evt, this)
  }

  addObjectSetTrigger() {
    const props = this.props
    $(document).off('object_set_toggled.' + this.props.data.id)
    $(document).on('object_set_toggled.' + this.props.data.id, (evt, data) => {
      // @ts-ignore @todo where is dispatch defined
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
    if (this.context.view_type === ViewType.OUTCOME_EDIT) {
      return <OutcomeEdit objectID={this.props.data.id} />
    }
    return <Workflow objectID={this.props.data.id} />
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

const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    data: state.workflow,
    object_sets: state.objectset
  }
}

const WorkflowBase = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(WorkflowBaseUnconnected)

export default WorkflowBase
