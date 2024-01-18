import * as React from 'react'
import { getWeekWorkflowByID } from '@cfFindState'
import { connect } from 'react-redux'
import JumpToWeekView from '@cfViews/WorkflowBaseView/JumpToWeekView'

/**
 * The weekworkflow representation for the "jump to" menu
 */
class JumpToWeekWorkflowUnconnected extends React.Component {
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
        renderer={this.props.renderer}
      />
    )
  }
}
const mapWeekWorkflowStateToProps = (state, own_props) =>
  getWeekWorkflowByID(state, own_props.objectID)

const JumpToWeekWorkflow = connect(
  mapWeekWorkflowStateToProps,
  null
)(JumpToWeekWorkflowUnconnected)

export default JumpToWeekWorkflow
