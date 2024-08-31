import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'

import WorkflowCardWrapper from '@cfCommonComponents/cards/WorkflowCardWrapper'
import OutcomeEdit from './OutcomeEdit'
import ComparisonWorkflow from './ComparisonWorkflow'
import ActionCreator from '@cfRedux/ActionCreator'
import { CfObjectType, ViewType } from '@cfModule/types/enum.js'
import { AppState } from '@cfRedux/types/type'
import EditableComponent, {
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import { getWorkflowParentDataQuery } from '@XMLHTTP/API/workflow'
import { _t } from '@cf/utility/utilityFunctions'

type ConnectedProps = {
  data: any
  object_sets: any
}
type OwnProps = {
  view_type: ViewType
  rank?: number
}
type StateProps = EditableComponentStateType
type PropsType = DispatchProp & ConnectedProps & OwnProps

//Container for common elements for workflows
class ComparisonWorkflowBaseUnconnected extends EditableComponent<
  PropsType,
  StateProps
> {
  static contextType = WorkFlowConfigContext
  constructor(props: PropsType) {
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
    this.context.selectionManager.changeSelection(evt, this)
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
    if (this.context.viewType === ViewType.OUTCOME_EDIT) {
      getWorkflowParentDataQuery(this.props.data.id, (response) => {
        this.props.dispatch(
          ActionCreator.refreshStoreData(response.data_package)
        )
      })
      return <OutcomeEdit objectID={this.props.data.id} />
    }
    return <ComparisonWorkflow objectID={this.props.data.id} />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const style: React.CSSProperties = {
      border: data.lock ? '2px solid ' + data.lock.user_colour : undefined // @todo not sure what the best default state is for this
    }

    const portal = this.addEditable(data, true)
    return (
      <>
        {portal}
        <div className="workflow-header" style={style}>

          {/*<WorkflowCard*/}
          {/*  workflowData={data}*/}
          {/*  selectAction={this.openEdit.bind(this, null)}*/}
          {/*/>*/}
          placeholder card

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

const ComparisonWorkflowBase = connect<
  ConnectedProps,
  DispatchProp,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(ComparisonWorkflowBaseUnconnected)

export default ComparisonWorkflowBase
