import * as React from 'react'
import { connect } from 'react-redux'
import { getWeekWorkflowByID } from '@cfFindState'
import Week from './Week'
import { WeekWorkflowUnconnected } from '../WorkflowView'

/**
 * As above, but for the comparison view specifically. This renders a
 * "WeekComparison" component instead, which will be a single column wide
 */
class WeekWorkflowComparisonUnconnected extends WeekWorkflowUnconnected {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  render() {
    const data = this.props.data
    let my_class = 'week-workflow'
    if (data.no_drag) my_class += ' no-drag'
    var week = (
      <Week
        objectID={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
        renderer={this.props.renderer}
      />
    )

    return (
      <div
        className={my_class}
        id={data.id}
        ref={this.maindiv}
        data-child-id={data.week}
      >
        {week}
      </div>
    )
  }
}
const mapWeekWorkflowStateToProps = (state, own_props) =>
  getWeekWorkflowByID(state, own_props.objectID)
const WeekWorkflowComparison = connect(
  mapWeekWorkflowStateToProps,
  null
)(WeekWorkflowComparisonUnconnected)

export default WeekWorkflowComparison
