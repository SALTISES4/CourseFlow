import * as React from 'react'
import { connect } from 'react-redux'
import { getWeekWorkflowByID } from '@cfFindState'
import { WeekWorkflowUnconnected } from '@cfViews/WorkflowView/WeekWorkflow'
import WeekComparison from "@cfViews/ComparisonView/WeekComparison";

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

    const cssClasses = ['week-workflow', data.no_drag ? 'no-drag' : ''].join(
      ' '
    )

    const week = (
      <WeekComparison
        objectID={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
        renderer={this.props.renderer}
      />
    )

    return (
      <div
        className={cssClasses}
        id={data.id}
        ref={this.mainDiv}
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
