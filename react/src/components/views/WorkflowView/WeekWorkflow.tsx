import * as React from 'react'
import { connect } from 'react-redux'
import Week from './Week'
import Term from './Term'
import { GetWeekWorkflowByID, getWeekWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/type'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfParentComponents/ComponentWithToggleDrop'
import {CfObjectType} from "@cfModule/types/enum";
// import $ from 'jquery'

type ConnectedProps = GetWeekWorkflowByID
type OwnProps = {
  condensed: boolean
  objectID: number
  parentID: number
  renderer: any
} & ComponentWithToggleProps
type PropsType = ConnectedProps & OwnProps

/**
 * The week-workflow throughmodel representation
 */
class WeekWorkflowUnconnected extends ComponentWithToggleDrop<PropsType> {
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WEEKWORKFLOW
    this.objectClass = '.week-workflow'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let my_class = 'week-workflow'
    if (data.no_drag) my_class += ' no-drag'
    if ($(this.mainDiv?.current).hasClass('dragging')) my_class += ' dragging'
    let week
    if (this.props.condensed)
      week = (
        <Term
          objectID={data.week}
          rank={this.props.order.indexOf(data.id)}
          parentID={this.props.parentID}
          renderer={this.props.renderer}
          throughParentID={data.id}
        />
      )
    else
      week = (
        <Week
          objectID={data.week}
          rank={this.props.order.indexOf(data.id)}
          parentID={this.props.parentID}
          renderer={this.props.renderer}
          throughParentID={data.id}
        />
      )
    return (
      <div
        className={my_class}
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
): GetWeekWorkflowByID => {
  return getWeekWorkflowByID(state, ownProps.objectID)
}

const WeekWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekWorkflowStateToProps,
  null
)(WeekWorkflowUnconnected)

export default WeekWorkflow
export { WeekWorkflowUnconnected }
