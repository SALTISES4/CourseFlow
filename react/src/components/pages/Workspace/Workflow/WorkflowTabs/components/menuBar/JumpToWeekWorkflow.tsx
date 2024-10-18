import { TGetWeekWorkflowById, getWeekWorkflowByID } from '@cfFindState'
import JumpToWeekView from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/JumpToWeekView'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = TGetWeekWorkflowById
type OwnProps = {
  objectId: number
  parentID?: number
  order?: any // @this is conflict with the redux props map, is it an intentional ovveride?
}
type PropsType = ConnectedProps & OwnProps

/**
 * The weekworkflow representation for the "jump to" menu
 */
class JumpToWeekWorkflowUnconnected extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    return (
      <JumpToWeekView
        objectId={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
      />
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetWeekWorkflowById => {
  return getWeekWorkflowByID(state, ownProps.objectId)
}

const JumpToWeekWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(JumpToWeekWorkflowUnconnected)

export default JumpToWeekWorkflow
