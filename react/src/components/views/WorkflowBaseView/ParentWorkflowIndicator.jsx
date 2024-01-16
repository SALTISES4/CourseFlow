import * as React from 'react'
import * as reactDom from 'react-dom'
import { WorkflowTitle } from '@cfUIComponents'
import { connect } from 'react-redux'
import {
  getParentWorkflowInfoQuery,
  getPublicParentWorkflowInfo
} from '@XMLHTTP/API/workflow'
// import $ from 'jquery'

/**
 * Shows the parent workflows for the current workflow, as well
 * as the workflows that have been used, for quick navigation in the
 * left-hand sidebar.
 */
class ParentWorkflowIndicatorUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    if (this.props.renderer.public_view) {
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
      return reactDom.createPortal(
        return_val,
        $('#react-portal-left-panel-extra')[0]
      )
    }

    return null
  }
}
const mapParentWorkflowIndicatorStateToProps = (state) => ({
  child_workflows: state.node
    .filter((node) => node.linked_workflow_data)
    .map((node) => ({
      id: node.linked_workflow,
      title: node.linked_workflow_data.title,
      description: node.linked_workflow_data.description,
      url: node.linked_workflow_data.url,
      deleted: node.linked_workflow_data.deleted
    }))
})
const ParentWorkflowIndicator = connect(
  mapParentWorkflowIndicatorStateToProps,
  null
)(ParentWorkflowIndicatorUnconnected)

export default ParentWorkflowIndicator
