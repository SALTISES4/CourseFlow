import * as React from 'react'
import { Provider, connect } from 'react-redux'
import Node from './Node.js'
import { getNodeWeekByID } from '@cfFindState'
import { NodeWeekUnconnected } from '../WorkflowView'

/**
 * NodeWeek for the comparison view
 */
class NodeWeekComparisonUnconnected extends NodeWeekUnconnected {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getNode() {
    let data = this.props.data
    return (
      <Node
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
const NodeWeekComparison = connect(
  mapNodeWeekStateToProps,
  null
)(NodeWeekComparisonUnconnected)

export default NodeWeekComparison
