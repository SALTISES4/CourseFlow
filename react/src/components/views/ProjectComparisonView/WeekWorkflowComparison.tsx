import { TGetWeekWorkflowByID, getWeekWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import ComparisonWeek from '@cfViews/ProjectComparisonView/ComparisonWeek'
import {
  WeekWorkflowUnconnected,
  WeekWorkflowUnconnectedProps
} from '@cfViews/WorkflowView/componentViews/WorkflowView/components/WeekWorkflow'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = TGetWeekWorkflowByID
type OwnProps = WeekWorkflowUnconnectedProps

type PropsType = ConnectedProps & OwnProps

/**
 * As above, but for the comparison view specifically. This renders a
 * "WeekComparison" component instead, which will be a single column wide
 */
class WeekWorkflowComparisonUnconnected extends WeekWorkflowUnconnected<PropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  render() {
    const data = this.props.data

    const cssClasses = ['week-workflow', data.no_drag ? 'no-drag' : ''].join(
      ' '
    )

    const week = (
      <ComparisonWeek
        objectId={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
        // renderer={this.props.renderer}
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
const mapWeekWorkflowStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetWeekWorkflowByID => {
  return getWeekWorkflowByID(state, ownProps.objectId)
}

const WeekWorkflowComparison = connect<
  ConnectedProps,
  object,
  OwnProps,
  AppState
>(
  mapWeekWorkflowStateToProps,
  null
)(WeekWorkflowComparisonUnconnected)

export default WeekWorkflowComparison
