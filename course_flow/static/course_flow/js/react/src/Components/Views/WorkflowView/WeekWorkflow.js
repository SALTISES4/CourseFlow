import * as React from 'react'
import { Provider, connect } from 'react-redux'
import Week from './Week.js'
import Term from './Term.js'
import { getWeekWorkflowByID } from '@cfFindState'
import { Component } from '@cfCommonComponents'

/**
 * The week-workflow throughmodel representation
 */
class WeekWorkflowUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'weekworkflow'
    this.objectClass = '.week-workflow'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let my_class = 'week-workflow'
    if (data.no_drag) my_class += ' no-drag'
    if ($(this.maindiv.current).hasClass('dragging')) my_class += ' dragging'
    var week
    if (this.props.condensed)
      week = (
        <Term
          objectID={data.week}
          rank={this.props.order.indexOf(data.id)}
          parentID={this.props.parentID}
          throughParentID={data.id}
          renderer={this.props.renderer}
        />
      )
    else
      week = (
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
const WeekWorkflow = connect(
  mapWeekWorkflowStateToProps,
  null
)(WeekWorkflowUnconnected)

export default WeekWorkflow
export { WeekWorkflowUnconnected }
