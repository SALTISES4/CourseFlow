import * as React from 'react'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import { connect, DispatchProp } from 'react-redux'
import {
  getParentWorkflowInfoQuery,
  getPublicParentWorkflowInfo
} from '@XMLHTTP/API/workflow'
import { AppState } from '@cfRedux/types/type'
import Divider from '@mui/material/Divider'
import { Typography } from '@mui/material'
import { _t } from '@cf/utility/utilityFunctions'

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
  componentDidUpdate(prevProps: PropsType) {
    if (!this.props.workflowId) {
      console.log('not defined')
      return
    }
    if (this.props.workflowId === prevProps.workflowId) {
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
      _t(ype),
      data.is_strategy ? _t(' strategy') : ''
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

      const ParentWorkflows = () => {
        if (this.state.parent_workflows.length > 0) {
          return (
            <>
              <Typography>{_t('Used in:')}</Typography>
              {this.state.parent_workflows.map((workflow, index) => (
                <WorkflowTitle
                  key={`WorkflowTitleParent-${index}`}
                  data={workflow}
                  test_id="panel-favourite"
                />
              ))}
            </>
          )
        }
        return null
      }

      const ChildWorkflows = () => {
        if (this.props.childWorkflows.length > 0) {
          return (
            <>
              <Typography>{_t('Workflows Used:')}</Typography>
              {this.props.childWorkflows.map((workflow, index) => (
                <WorkflowTitle
                  key={`WorkflowTitleParent-${index}`}
                  data={workflow}
                  test_id="panel-favourite"
                />
              ))}
            </>
          )
        }
        return null
      }

      return (
        <>
          <Divider />
          <Typography>{_t('Quick Navigation')}</Typography>
          <ParentWorkflows />
          <ChildWorkflows />
        </>
      )
    }
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
