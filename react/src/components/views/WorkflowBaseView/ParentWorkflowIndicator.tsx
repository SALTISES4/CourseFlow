import * as React from 'react'
import * as reactDom from 'react-dom'
import { WorkflowTitle } from '@cfUIComponents'
import { connect } from 'react-redux'
import {
  getParentWorkflowInfoQuery,
  getPublicParentWorkflowInfo
} from '@XMLHTTP/API/workflow'
import { AppState } from '@cfRedux/type'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
// import $ from 'jquery'

type ConnectedProps = {
  child_workflows: any
}
type OwnProps = { workflow_id: number }
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
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)
    this.state = {} as StateProps
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.context.public_view) {
      getPublicParentWorkflowInfo(this.props.workflow_id, (response_data) =>
        this.setState({
          parent_workflows: response_data.parent_workflows,
          has_loaded: true
        })
      )
    } else {
      getParentWorkflowInfoQuery(this.props.workflow_id, (response_data) =>
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
    let type_text = window.gettext(type)
    if (data.is_strategy) type_text += window.gettext(' strategy')
    return <div className={'workflow-type-indicator ' + type}>{type_text}</div>
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (this.state.has_loaded) {
      if (
        this.state.parent_workflows.length == 0 &&
        this.props.child_workflows.length == 0
      ) {
        return null
      }

      const parent_workflows = this.state.parent_workflows.map(
        (parent_workflow, index) => (
          <WorkflowTitle
            key={`WorkflowTitleParent-${index}`}
            data={parent_workflow}
            test_id="panel-favourite"
          />
        )
      )
      const child_workflows = this.props.child_workflows.map(
        (child_workflow, index) => (
          <WorkflowTitle
            key={`WorkflowTitleChild-${index}`}
            data={child_workflow}
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
      // return reactDom.createPortal(return_val, $('.left-panel-extra')[0])
      // @todo see https://course-flow.atlassian.net/browse/COUR-246
      const portal = reactDom.createPortal(
        return_val,
        $('#react-portal-left-panel-extra')[0]
      )

      return <>{portal}</>
    }

    return <></>
  }
}
const mapStateToProps = (state: AppState) => {
  return {
    child_workflows: state.node
      .filter((node) => node.linked_workflow_data)
      .map((node) => {
        return {
          id: node.linked_workflow,
          // @ts-ignore
          title: node?.linked_workflow_data?.title || '',
          // @ts-ignore
          description: node?.linked_workflow_data?.description || '',
          // @ts-ignore
          url: node?.linked_workflow_data?.url || '',
          // @ts-ignore
          deleted: node?.linked_workflow_data?.deleted || false
        }
      })
  }
}
const ParentWorkflowIndicator = connect<
  ConnectedProps,
  object,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(ParentWorkflowIndicatorUnconnected)

export default ParentWorkflowIndicator
