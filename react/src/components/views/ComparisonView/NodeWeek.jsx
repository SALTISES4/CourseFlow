import * as React from 'react'
import { connect } from 'react-redux'
import { getNodeWeekByID } from '@cfFindState'
// @local
import Node from './Node'
import { NodeWeekUnconnected } from '../WorkflowView'

/**
 * NodeWeek for the comparison view
 */
class NodeWeekComparisonUnconnected extends NodeWeekUnconnected {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getNode() {
    const data = this.props.data
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
