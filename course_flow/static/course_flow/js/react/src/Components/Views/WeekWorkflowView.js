import * as React from 'react'
import { Provider, connect } from 'react-redux'
import WeekView from './WeekView.js'
import TermView from './TermView.js'
import { getWeekWorkflowByID } from '../../redux/FindState.js'
import { Component } from '../components/CommonComponents'
import {} from '../../Reducers.js'
import { WeekComparisonView, NodeBarWeekView } from './WeekView.js'

//Basic weekworkflow component
class WeekWorkflowView extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'weekworkflow'
    this.objectClass = '.week-workflow'
  }

  render() {
    let data = this.props.data
    let my_class = 'week-workflow'
    if (data.no_drag) my_class += ' no-drag'
    if ($(this.maindiv.current).hasClass('dragging')) my_class += ' dragging'
    var week
    if (this.props.condensed)
      week = (
        <TermView
          objectID={data.week}
          rank={this.props.order.indexOf(data.id)}
          parentID={this.props.parentID}
          throughParentID={data.id}
          renderer={this.props.renderer}
        />
      )
    else
      week = (
        <WeekView
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
export default connect(mapWeekWorkflowStateToProps, null)(WeekWorkflowView)

//Basic weekworkflow component
class WeekWorkflowComparisonViewUnconnected extends WeekWorkflowView {
  render() {
    let data = this.props.data
    let my_class = 'week-workflow'
    if (data.no_drag) my_class += ' no-drag'
    var week = (
      <WeekComparisonView
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
export const WeekWorkflowComparisonView = connect(
  mapWeekWorkflowStateToProps,
  null
)(WeekWorkflowComparisonViewUnconnected)

class NodeBarWeekWorkflowUnconnected extends React.Component {
  render() {
    let data = this.props.data
    return (
      <NodeBarWeekView
        objectID={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
        renderer={this.props.renderer}
      />
    )
  }
}
export const NodeBarWeekWorkflow = connect(
  mapWeekWorkflowStateToProps,
  null
)(NodeBarWeekWorkflowUnconnected)
