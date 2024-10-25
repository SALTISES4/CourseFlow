import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum.js'
import { _t } from '@cf/utility/utilityFunctions'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import EditableComponent, {
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import {
  getWorkflowParentDataQuery,
  getWorkflowParentDataQueryLegacy
} from '@XMLHTTP/API/workflow'
import * as React from 'react'
import { DispatchProp, connect } from 'react-redux'

import ComparisonWorkflow from './ComparisonWorkflow'
import OutcomeEdit from './OutcomeEdit'

type ConnectedProps = {
  data: any
  objectSets: any
}
type OwnProps = {
  viewType: WorkflowViewType
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
    this.context.selectionManager.changeSelection({ evt, newSelection: this })
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
    if (this.context.workflowView === WorkflowViewType.OUTCOME_EDIT) {
      getWorkflowParentDataQueryLegacy(this.props.data.id, (response) => {
        this.props.dispatch(
          ActionCreator.refreshStoreData(response.dataPackage)
        )
      })
      return <OutcomeEdit objectId={this.props.data.id} />
    }
    return <ComparisonWorkflow objectId={this.props.data.id} />
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const style: React.CSSProperties = {
      border: data.lock ? '2px solid ' + data.lock.userColour : undefined // @todo not sure what the best default state is for this
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
    objectSets: state.objectset
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
