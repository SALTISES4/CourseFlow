import { _t } from '@cf/utility/utilityFunctions'
import { AppState } from '@cfRedux/types/type'
import { Typography } from '@mui/material'
import Divider from '@mui/material/Divider'
import {
  getParentWorkflowInfoQuery,
  getPublicParentWorkflowInfo
} from '@XMLHTTP/API/workflow'
import * as React from 'react'
import { DispatchProp, connect } from 'react-redux'

type ConnectedProps = {
  childWorkflows: any
  workflowId: number
  publicView: boolean
}
type OwnProps = NonNullable<unknown>
type StateProps = {
  hasLoaded: boolean
  parentWorkflows: any
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
      getPublicParentWorkflowInfo(this.props.workflowId, (responseData) =>
        this.setState({
          parentWorkflows: responseData.parentWorkflows,
          hasLoaded: true
        })
      )
    } else {
      getParentWorkflowInfoQuery(this.props.workflowId, (responseData) =>
        this.setState({
          parentWorkflows: responseData.parentWorkflows,
          hasLoaded: true
        })
      )
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getTypeIndicator(data) {
    const type = data.type

    const text = [_t(type), data.isStrategy ? _t(' strategy') : ''].join('')

    return <div className={'workflow-type-indicator ' + type}>{text}</div>
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (this.state.hasLoaded) {
      if (
        this.state.parentWorkflows.length == 0 &&
        this.props.childWorkflows.length == 0
      ) {
        return null
      }

      const ParentWorkflows = () => {
        if (this.state.parentWorkflows.length > 0) {
          return (
            <>
              <Typography>{_t('Used in:')}</Typography>
              {/*{this.state.parentWorkflows.map((workflow, index) => (*/}
              {/*  // <WorkflowTitle*/}
              {/*  //   key={`WorkflowTitleParent-${index}`}*/}
              {/*  //   data={workflow}*/}
              {/*  //   test_id="panel-favourite"*/}
              {/*  // />*/}
              {/*  placeholder title*/}
              {/*))}*/}
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
              {/*{this.props.childWorkflows.map((workflow, index) => (*/}
              {/*  <WorkflowTitle*/}
              {/*    key={`WorkflowTitleParent-${index}`}*/}
              {/*    data={workflow}*/}
              {/*    test_id="panel-favourite"*/}
              {/*  />*/}
              {/*))}*/}
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
    publicView: state.workflow.publicView,
    childWorkflows: state.node
      .filter((node) => node.linkedWorkflowData)
      .map((node) => {
        return {
          id: node.linkedWorkflow,
          title: node?.linkedWorkflowData?.title || '',
          description: node?.linkedWorkflowData?.description || '',
          url: node?.linkedWorkflowData?.url || '',
          deleted: node?.linkedWorkflowData?.deleted || false
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
