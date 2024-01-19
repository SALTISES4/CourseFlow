import * as React from 'react'
import { GetWeekWorkflowByID, getWeekWorkflowByID } from '@cfFindState'
import { connect } from 'react-redux'
import JumpToWeekView from '@cfViews/WorkflowBaseView/JumpToWeekView'
import { AppState } from '@cfRedux/type'

type ConnectedProps = GetWeekWorkflowByID
type OwnProps = {
  objectID: number
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
        objectID={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
        // renderer={this.props.renderer}
      />
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): GetWeekWorkflowByID => {
  return getWeekWorkflowByID(state, ownProps.objectID)
}

const JumpToWeekWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(JumpToWeekWorkflowUnconnected)

export default JumpToWeekWorkflow
