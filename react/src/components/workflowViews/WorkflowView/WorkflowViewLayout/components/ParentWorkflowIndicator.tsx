import * as React from 'react'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import { connect, DispatchProp } from 'react-redux'
import {
  getParentWorkflowInfoQuery,
  getPublicParentWorkflowInfo
} from '@XMLHTTP/API/workflow'
import { AppState } from '@cfRedux/types/type'

type ConnectedProps = {
  childWorkflows: any
  workflowId: number
  publicView: boolean
}
type OwnProps = NonNullable<unknown>
type StateProps = {
  has_loaded: boolean
  parent_workflows: any
}
type PropsType = ConnectedProps & OwnProps
/**
 * Shows the parent workflows for the current workflow, as well
 * as the workflows that have been used, for quick navigation in the
 * left-hand sidebar.
 */
class ParentWorkflowIndicatorUnconnected extends React.Component<
  PropsType,
  StateProps
> {
  constructor(props: PropsType) {
    super(props)
    this.state = {} as StateProps
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidUpdate() {
    if (!this.props.workflowId) {
      console.log('not defined')
      return
    }

    if (this.props.publicView) {
      getPublicParentWorkflowInfo(this.props.workflowId, (response_data) =>
        this.setState({
          parent_workflows: response_data.parent_workflows,
          has_loaded: true
        })
      )
    } else {
      getParentWorkflowInfoQuery(this.props.workflowId, (response_data) =>
        this.setState({
          parent_workflows: response_data.parent_workflows,
          has_loaded: true
        })
      )
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getTypeIndicator(data) {
    const type = data.type

    const text = [
      window.gettext(type),
      data.is_strategy ? window.gettext(' strategy') : ''
    ].join('')

    return <div className={'workflow-type-indicator ' + type}>{text}</div>
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (this.state.has_loaded) {
      if (
        this.state.parent_workflows.length == 0 &&
        this.props.childWorkflows.length == 0
      ) {
        return null
      }

      const parent_workflows = this.state.parent_workflows.map(
        (childWorkflow, index) => (
          <WorkflowTitle
            key={`WorkflowTitleParent-${index}`}
            data={childWorkflow}
            test_id="panel-favourite"
          />
        )
      )
      const child_workflows = this.props.childWorkflows.map(
        (childWorkflow, index) => (
          <WorkflowTitle
            key={`WorkflowTitleChild-${index}`}
            data={childWorkflow}
            test_id="panel-favourite"
          />
        )
      )
      const return_val = [
        <hr key="br" />,
        <a key="quick-nav" className="panel-item">
          {window.gettext('Quick Navigation')}
        </a>
      ]
      if (parent_workflows.length > 0)
        return_val.push(
          <a className="panel-item">{window.gettext('Used in:')}</a>,
          ...parent_workflows
        )
      if (child_workflows.length > 0)
        return_val.push(
          <a className="panel-item">{window.gettext('Workflows Used:')}</a>,
          ...child_workflows
        )

      return <>{return_val}</>
    }

    return <></>
  }
}
const mapStateToProps = (state: AppState) => {
  return {
    workflowId: state.workflow.id,
    publicView: state.workflow.public_view,
    childWorkflows: state.node
      .filter((node) => node.linked_workflow_data)
      .map((node) => {
        return {
          id: node.linked_workflow,
          title: node?.linked_workflow_data?.title || '',
          description: node?.linked_workflow_data?.description || '',
          url: node?.linked_workflow_data?.url || '',
          deleted: node?.linked_workflow_data?.deleted || false
        }
      })
  }
}
const ParentWorkflowIndicator = connect<
  ConnectedProps,
  DispatchProp,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(ParentWorkflowIndicatorUnconnected)

export default ParentWorkflowIndicator
