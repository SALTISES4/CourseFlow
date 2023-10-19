import * as React from 'react'
import { Provider, connect } from 'react-redux'
import NodeView from './NodeView.js'
import { NodeComparisonView } from './NodeView.js'
import { getNodeWeekByID } from '../../FindState.js'
import {} from '../../Reducers.js'

//Basic component to represent a NodeWeek
class NodeWeekView extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'nodeweek'
    this.objectClass = '.node-week'
  }

  render() {
    let data = this.props.data
    let my_class = 'node-week'
    if (data.no_drag) my_class += ' no-drag'
    return (
      <div
        className={my_class}
        id={data.id}
        data-child-id={data.node}
        data-column-id={this.props.column}
        ref={this.maindiv}
      >
        {this.getNode()}
      </div>
    )
  }

  getNode() {
    let data = this.props.data
    return (
      <NodeView
        objectID={data.node}
        parentID={this.props.parentID}
        throughParentID={data.id}
        renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    )
  }
}
const mapNodeWeekStateToProps = (state, own_props) =>
  getNodeWeekByID(state, own_props.objectID)
export default connect(mapNodeWeekStateToProps, null)(NodeWeekView)

//Basic component to represent a NodeWeek for comparisons
class NodeWeekComparisonViewUnconnected extends NodeWeekView {
  getNode() {
    let data = this.props.data
    return (
      <NodeComparisonView
        objectID={data.node}
        parentID={this.props.parentID}
        throughParentID={data.id}
        renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    )
  }
}
export const NodeWeekComparisonView = connect(
  mapNodeWeekStateToProps,
  null
)(NodeWeekComparisonViewUnconnected)
